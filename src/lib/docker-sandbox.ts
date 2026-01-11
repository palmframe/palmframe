import Dockerode from 'dockerode'
import * as tar from 'tar-stream'
import { Readable } from 'stream'
import { SandboxInstance } from './sandbox-provider'

export class DockerSandbox implements SandboxInstance {
  id: string
  template: string
  private container: Dockerode.Container
  private docker: Dockerode
  private portMappings: Map<number, number> = new Map()

  constructor(
    id: string,
    template: string,
    container: Dockerode.Container,
    docker: Dockerode
  ) {
    this.id = id
    this.template = template
    this.container = container
    this.docker = docker
  }

  /**
   * Execute Python code for code-interpreter-v1 template
   * Returns E2B-compatible result format
   */
  async runCode(code: string): Promise<any> {
    try {
      // Write code to temporary file
      await this.files.write('/tmp/exec_code.py', code)

      // Execute Python code
      const exec = await this.container.exec({
        Cmd: ['python3', '/tmp/exec_code.py'],
        AttachStdout: true,
        AttachStderr: true,
      })

      const stream = await exec.start({ Detach: false, Tty: false })

      return new Promise((resolve, reject) => {
        let stdout = ''
        let stderr = ''

        stream.on('data', (chunk: Buffer) => {
          // Docker multiplexes streams with 8-byte header
          // Header format: [stream_type, 0, 0, 0, size1, size2, size3, size4]
          // stream_type: 1=stdout, 2=stderr
          const header = chunk.slice(0, 8)
          const data = chunk.slice(8).toString()

          if (header[0] === 1) {
            stdout += data
          } else if (header[0] === 2) {
            stderr += data
          }
        })

        stream.on('end', () => {
          resolve({
            logs: {
              stdout: stdout.split('\n').filter((line) => line.trim()),
              stderr: stderr.split('\n').filter((line) => line.trim()),
            },
            error: stderr
              ? {
                  name: 'RuntimeError',
                  value: stderr,
                  traceback: stderr,
                }
              : null,
            results: stdout
              ? [
                  {
                    text: stdout,
                  },
                ]
              : [],
          })
        })

        stream.on('error', reject)
      })
    } catch (error) {
      console.error('Error executing code:', error)
      return {
        logs: {
          stdout: [],
          stderr: [String(error)],
        },
        error: {
          name: 'ExecutionError',
          value: String(error),
          traceback: String(error),
        },
        results: [],
      }
    }
  }

  /**
   * Get host URL for web templates
   * Returns host:port format
   */
  getHost(port: number): string {
    const dockerHost = process.env.DOCKER_HOST || 'localhost'
    const host = dockerHost.replace(/^tcp:\/\//, '').split(':')[0]

    // Get the mapped host port
    const mappedPort = this.portMappings.get(port) || port

    return `${host}:${mappedPort}`
  }

  /**
   * Execute arbitrary shell commands in the container
   */
  commands = {
    run: async (command: string): Promise<any> => {
      try {
        const exec = await this.container.exec({
          Cmd: ['sh', '-c', command],
          AttachStdout: true,
          AttachStderr: true,
        })

        const stream = await exec.start({ Detach: false, Tty: false })

        return new Promise((resolve, reject) => {
          let output = ''
          let errorOutput = ''

          stream.on('data', (chunk: Buffer) => {
            const header = chunk.slice(0, 8)
            const data = chunk.slice(8).toString()

            if (header[0] === 1) {
              output += data
            } else if (header[0] === 2) {
              errorOutput += data
            }
          })

          stream.on('end', async () => {
            const inspect = await exec.inspect()
            resolve({
              stdout: output,
              stderr: errorOutput,
              exit_code: inspect.ExitCode || 0,
            })
          })

          stream.on('error', reject)
        })
      } catch (error) {
        console.error('Error running command:', error)
        return {
          stdout: '',
          stderr: String(error),
          exit_code: 1,
        }
      }
    },
  }

  /**
   * Write files to the container filesystem
   * Uses tar stream to create and upload files
   */
  files = {
    write: async (path: string, content: string): Promise<void> => {
      try {
        const pack = tar.pack()

        // Extract directory and filename
        const fileName = path.split('/').pop() || 'file'
        const dirPath = path.substring(0, path.lastIndexOf('/')) || '/home/user'

        // Add file to tar archive
        pack.entry({ name: fileName }, content)
        pack.finalize()

        // Convert pack to readable stream
        const stream = Readable.from(pack)

        // Upload to container
        await this.container.putArchive(stream, {
          path: dirPath,
        })
      } catch (error) {
        console.error('Error writing file:', error)
        throw error
      }
    },
  }

  /**
   * Set port mapping for getHost()
   */
  setPortMapping(containerPort: number, hostPort: number): void {
    this.portMappings.set(containerPort, hostPort)
  }

  /**
   * Get port mapping
   */
  getPortMapping(containerPort: number): number | undefined {
    return this.portMappings.get(containerPort)
  }
}
