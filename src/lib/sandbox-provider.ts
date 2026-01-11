import { FragmentSchema } from '@/lib/schema'

export type SandboxProvider = 'e2b' | 'daytona' | 'docker'

export interface SandboxInstance {
  id: string
  template: string
  runCode?: (code: string) => Promise<any>
  getHost?: (port: number) => string
  commands: {
    run: (command: string) => Promise<any>
  }
  files: {
    write: (path: string, content: string) => Promise<void>
  }
}

export interface SandboxProviderConfig {
  fragment: FragmentSchema
  userID?: string
  teamID?: string
  accessToken?: string
  timeoutMs?: number
}

export class SandboxProviderFactory {
  private static provider: SandboxProvider | null = null

  static getProvider(): SandboxProvider {
    if (!this.provider) {
      this.provider = this.detectProvider()
    }
    return this.provider
  }

  /**
   * Detect which sandbox provider to use based on environment variables
   * Priority: explicit SANDBOX_PROVIDER > E2B_API_KEY > DAYTONA_API_KEY > Docker (if available)
   */
  private static detectProvider(): SandboxProvider {
    // 1. Explicit env var takes precedence
    if (process.env.SANDBOX_PROVIDER) {
      return process.env.SANDBOX_PROVIDER as SandboxProvider
    }

    // 2. Check for API keys to auto-select
    if (process.env.E2B_API_KEY) {
      return 'e2b'
    }

    if (process.env.DAYTONA_API_KEY) {
      return 'daytona'
    }

    // 3. Default to Docker
    console.log('No E2B or Daytona API keys found, defaulting to Docker provider')
    return 'docker'
  }

  /**
   * Check if Docker is available
   */
  private static async checkDockerAvailable(): Promise<boolean> {
    try {
      const Dockerode = (await import('dockerode')).default
      const docker = new Dockerode({
        ...(process.env.DOCKER_HOST
          ? {
              protocol: 'http',
              host: process.env.DOCKER_HOST.replace(/^tcp:\/\//, '').split(':')[0],
              port: parseInt(
                process.env.DOCKER_HOST.replace(/^tcp:\/\//, '').split(':')[1] || '2375'
              ),
            }
          : { socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' }),
      })

      await docker.ping()
      return true
    } catch (error) {
      console.error('Docker is not available:', error)
      return false
    }
  }

  /**
   * Find an available port in the range 30000-40000
   */
  private static async findAvailablePort(): Promise<number> {
    // Simple implementation: use random port in range
    // In production, implement proper port allocation with collision detection
    return 30000 + Math.floor(Math.random() * 10000)
  }

  static async createSandbox(config: SandboxProviderConfig): Promise<SandboxInstance> {
    const provider = this.getProvider()

    if (provider === 'daytona') {
      return this.createDaytonaSandbox(config)
    } else if (provider === 'docker') {
      return this.createDockerSandbox(config)
    } else {
      return this.createE2BSandbox(config)
    }
  }

  private static async createE2BSandbox(config: SandboxProviderConfig): Promise<SandboxInstance> {
    const { Sandbox } = await import('@e2b/code-interpreter')

    const sbx = await Sandbox.create(config.fragment.template, {
      metadata: {
        template: config.fragment.template,
        userID: config.userID ?? '',
        teamID: config.teamID ?? '',
      },
      timeoutMs: config.timeoutMs,
      ...(config.teamID && config.accessToken
        ? {
            headers: {
              'X-Supabase-Team': config.teamID,
              'X-Supabase-Token': config.accessToken,
            },
          }
        : {}),
    })

    return {
      id: sbx.sandboxId,
      template: config.fragment.template,
      runCode: async (code: string) => await sbx.runCode(code),
      getHost: (port: number) => sbx.getHost(port),
      commands: {
        run: async (command: string) => await sbx.commands.run(command),
      },
      files: {
        write: async (path: string, content: string) => {
          await sbx.files.write(path, content)
        },
      },
    }
  }

  private static async createDaytonaSandbox(config: SandboxProviderConfig): Promise<SandboxInstance> {
    // Import Daytona SDK dynamically
    const { Daytona } = await import('@daytonaio/sdk')

    const daytona = new Daytona({
      apiKey: process.env.DAYTONA_API_KEY,
      apiUrl: process.env.DAYTONA_API_URL || 'https://app.daytona.io/api',
      target: process.env.DAYTONA_TARGET || 'us',
    })

    // Map E2B templates to Daytona languages
    const languageMap: Record<string, string> = {
      'code-interpreter-v1': 'python',
      'nextjs-developer': 'typescript',
      'vue-developer': 'typescript',
      'streamlit-developer': 'python',
      'gradio-developer': 'python',
    }

    const language = languageMap[config.fragment.template] || 'typescript'

    const sandbox = await daytona.create({
      language,
      envVars: {},
    })

    // Wrapper to provide E2B-like interface
    return {
      id: sandbox.id || 'daytona-' + Date.now(),
      template: config.fragment.template,
      runCode: async (code: string) => {
        // Execute Python code
        const result = await sandbox.process.executeCommand(`python3 -c "${code.replace(/"/g, '\\"')}"`)
        return {
          logs: {
            stdout: result.result ? [result.result] : [],
            stderr: [],
          },
          error: null,
          results: result.result ? [{ text: result.result }] : [],
        }
      },
      getHost: (_port: number) => {
        // Daytona doesn't expose hosts the same way
        // Return a placeholder or implement Daytona's equivalent
        return `daytona-${sandbox.id}.daytona.app`
      },
      commands: {
        run: async (command: string) => {
          return sandbox.process.executeCommand(command)
        },
      },
      files: {
        write: async (path: string, content: string) => {
          // Write file using cat with heredoc
          await sandbox.process.executeCommand(`cat > ${path} << 'PALMFRAME_EOF'\n${content}\nPALMFRAME_EOF`)
        },
      },
    }
  }

  private static async createDockerSandbox(config: SandboxProviderConfig): Promise<SandboxInstance> {
    const Dockerode = (await import('dockerode')).default

    const docker = new Dockerode({
      ...(process.env.DOCKER_HOST
        ? {
            protocol: 'http',
            host: process.env.DOCKER_HOST.replace(/^tcp:\/\//, '').split(':')[0],
            port: parseInt(
              process.env.DOCKER_HOST.replace(/^tcp:\/\//, '').split(':')[1] || '2375'
            ),
          }
        : { socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' }),
    })

    // Map template to Docker image
    const imageMap: Record<string, { image: string; port?: number }> = {
      'code-interpreter-v1': { image: 'palmframe/python-interpreter:latest' },
      'nextjs-developer': { image: 'palmframe/nextjs-developer:latest', port: 3000 },
      'nextjs-developer-dev': { image: 'palmframe/nextjs-developer:latest', port: 3000 },
      'vue-developer': { image: 'palmframe/vue-developer:latest', port: 3000 },
      'vue-developer-dev': { image: 'palmframe/vue-developer:latest', port: 3000 },
      'streamlit-developer': { image: 'palmframe/streamlit-developer:latest', port: 8501 },
      'streamlit-developer-dev': { image: 'palmframe/streamlit-developer:latest', port: 8501 },
      'gradio-developer': { image: 'palmframe/gradio-developer:latest', port: 7860 },
      'gradio-developer-dev': { image: 'palmframe/gradio-developer:latest', port: 7860 },
    }

    const templateConfig = imageMap[config.fragment.template]
    if (!templateConfig) {
      throw new Error(`Unsupported template: ${config.fragment.template}`)
    }

    // Generate unique container ID
    const containerId = `palmframe-${config.userID || 'anon'}-${Date.now()}`

    // Port mappings for web templates
    const portBindings: any = {}
    const exposedPorts: any = {}
    let hostPort: number | undefined

    if (templateConfig.port) {
      hostPort = await this.findAvailablePort()
      const containerPort = `${templateConfig.port}/tcp`
      exposedPorts[containerPort] = {}
      portBindings[containerPort] = [{ HostPort: String(hostPort) }]
    }

    // Create container
    const container = await docker.createContainer({
      Image: templateConfig.image,
      name: containerId,
      Tty: true,
      OpenStdin: true,
      ExposedPorts: exposedPorts,
      HostConfig: {
        PortBindings: portBindings,
        NetworkMode: process.env.DOCKER_NETWORK || 'bridge',
        AutoRemove: false,
        Memory: 1024 * 1024 * 1024, // 1GB
        MemorySwap: 2 * 1024 * 1024 * 1024, // 2GB
        CpuShares: 1024,
        PidsLimit: 100,
      },
      Labels: {
        'palmframe.sandbox': 'true',
        'palmframe.user': config.userID || '',
        'palmframe.team': config.teamID || '',
        'palmframe.template': config.fragment.template,
        'palmframe.created': new Date().toISOString(),
      },
    })

    // Start container
    await container.start()

    // Create DockerSandbox instance
    const { DockerSandbox } = await import('./docker-sandbox')
    const sandbox = new DockerSandbox(containerId, config.fragment.template, container, docker)

    // Set port mapping if applicable
    if (templateConfig.port && hostPort) {
      sandbox.setPortMapping(templateConfig.port, hostPort)
    }

    // Store timeout metadata
    if (config.timeoutMs) {
      await this.storeDockerTimeout(containerId, config.timeoutMs)
    } else {
      // Default 10 minute timeout
      await this.storeDockerTimeout(containerId, 10 * 60 * 1000)
    }

    return sandbox
  }

  private static async storeDockerTimeout(sbxId: string, timeoutMs: number): Promise<void> {
    const { DockerTimeoutManager } = await import('./docker-timeout-manager')
    await DockerTimeoutManager.storeTimeout(sbxId, timeoutMs)
  }

  static async setTimeout(
    sbxId: string,
    timeoutMs: number,
    options?: {
      headers?: Record<string, string>
    }
  ): Promise<void> {
    const provider = this.getProvider()

    if (provider === 'e2b') {
      const { Sandbox } = await import('@e2b/code-interpreter')
      await Sandbox.setTimeout(sbxId, timeoutMs, options)
    } else if (provider === 'daytona') {
      // Daytona may handle timeouts differently
      // Implement if Daytona SDK supports timeout configuration
      console.warn('Daytona timeout configuration not yet implemented')
    } else if (provider === 'docker') {
      const { DockerTimeoutManager } = await import('./docker-timeout-manager')
      await DockerTimeoutManager.extendTimeout(sbxId, timeoutMs)
    }
  }
}

export async function createSandbox(config: SandboxProviderConfig): Promise<SandboxInstance> {
  return SandboxProviderFactory.createSandbox(config)
}

export function getProviderName(): SandboxProvider {
  return SandboxProviderFactory.getProvider()
}

export function getProviderDisplayName(): string {
  const provider = getProviderName()
  if (provider === 'e2b') return 'E2B'
  if (provider === 'daytona') return 'Daytona'
  if (provider === 'docker') return 'Docker'
  return provider
}
