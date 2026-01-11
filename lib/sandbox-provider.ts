import { FragmentSchema } from '@/lib/schema'

export type SandboxProvider = 'e2b' | 'daytona'

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
  private static provider: SandboxProvider = (process.env.SANDBOX_PROVIDER as SandboxProvider) || 'e2b'

  static getProvider(): SandboxProvider {
    return this.provider
  }

  static async createSandbox(config: SandboxProviderConfig): Promise<SandboxInstance> {
    const provider = this.getProvider()

    if (provider === 'daytona') {
      return this.createDaytonaSandbox(config)
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
  return provider === 'e2b' ? 'E2B' : 'Daytona'
}
