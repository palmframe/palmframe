import Dockerode from 'dockerode'

interface TimeoutEntry {
  containerId: string
  expiresAt: number
  timeoutHandle?: NodeJS.Timeout
}

/**
 * DockerTimeoutManager
 * Manages container lifecycle and automatic cleanup after timeout
 */
export class DockerTimeoutManager {
  private static timeouts: Map<string, TimeoutEntry> = new Map()
  private static docker: Dockerode | null = null
  private static initialized = false
  private static cleanupInterval: NodeJS.Timeout | null = null

  /**
   * Initialize the timeout manager with Docker connection
   */
  static initialize(): void {
    if (this.initialized) {
      return
    }

    try {
      this.docker = new Dockerode({
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

      // Start background cleanup process
      this.startCleanupProcess()
      this.initialized = true

      console.log('DockerTimeoutManager initialized')
    } catch (error) {
      console.error('Failed to initialize DockerTimeoutManager:', error)
    }
  }

  /**
   * Store a timeout for a container
   * Will automatically cleanup the container after timeoutMs
   */
  static async storeTimeout(containerId: string, timeoutMs: number): Promise<void> {
    if (!this.initialized) {
      this.initialize()
    }

    const expiresAt = Date.now() + timeoutMs

    // Cancel existing timeout if any
    const existing = this.timeouts.get(containerId)
    if (existing?.timeoutHandle) {
      clearTimeout(existing.timeoutHandle)
    }

    // Set new timeout
    const timeoutHandle = setTimeout(() => {
      this.cleanupContainer(containerId)
    }, timeoutMs)

    this.timeouts.set(containerId, {
      containerId,
      expiresAt,
      timeoutHandle,
    })

    console.log(
      `Stored timeout for container ${containerId}, expires at ${new Date(expiresAt).toISOString()}`
    )
  }

  /**
   * Extend the timeout for an existing container
   * Used when user publishes the sandbox with a new duration
   */
  static async extendTimeout(containerId: string, additionalMs: number): Promise<void> {
    if (!this.initialized) {
      this.initialize()
    }

    const existing = this.timeouts.get(containerId)
    if (!existing) {
      console.warn(`Container ${containerId} not found in timeout manager, creating new timeout`)
      await this.storeTimeout(containerId, additionalMs)
      return
    }

    // Clear existing timeout
    if (existing.timeoutHandle) {
      clearTimeout(existing.timeoutHandle)
    }

    const newExpiresAt = Date.now() + additionalMs
    const timeoutHandle = setTimeout(() => {
      this.cleanupContainer(containerId)
    }, additionalMs)

    this.timeouts.set(containerId, {
      containerId,
      expiresAt: newExpiresAt,
      timeoutHandle,
    })

    console.log(
      `Extended timeout for container ${containerId}, now expires at ${new Date(newExpiresAt).toISOString()}`
    )
  }

  /**
   * Manually cleanup a container immediately
   */
  static async cleanupContainer(containerId: string): Promise<void> {
    if (!this.docker) {
      console.error('Docker not initialized')
      return
    }

    try {
      const container = this.docker.getContainer(containerId)

      // Check if container exists
      const info = await container.inspect().catch(() => null)
      if (!info) {
        console.log(`Container ${containerId} not found, removing from tracking`)
        this.timeouts.delete(containerId)
        return
      }

      // Stop container if running
      if (info.State.Running) {
        console.log(`Stopping container ${containerId}...`)
        await container.stop({ t: 5 }).catch((err) => {
          // Ignore error if container already stopped
          if (!err.message.includes('is not running')) {
            throw err
          }
        })
      }

      // Remove container
      console.log(`Removing container ${containerId}...`)
      await container.remove({ force: true })

      // Remove from timeout tracking
      this.timeouts.delete(containerId)

      console.log(`✓ Cleaned up container ${containerId}`)
    } catch (error) {
      console.error(`Failed to cleanup container ${containerId}:`, error)
    }
  }

  /**
   * Start background cleanup process
   * Checks every 60 seconds for expired containers
   */
  private static startCleanupProcess(): void {
    if (this.cleanupInterval) {
      return
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredContainers()
    }, 60 * 1000) // Run every minute

    console.log('Started background cleanup process')
  }

  /**
   * Check for and cleanup expired containers
   */
  private static async cleanupExpiredContainers(): Promise<void> {
    if (!this.docker) {
      return
    }

    const now = Date.now()
    const expiredContainers: string[] = []

    // Find expired containers
    for (const [containerId, entry] of this.timeouts.entries()) {
      if (entry.expiresAt <= now) {
        expiredContainers.push(containerId)
      }
    }

    // Cleanup expired containers
    if (expiredContainers.length > 0) {
      console.log(`Found ${expiredContainers.length} expired containers to cleanup`)
      for (const containerId of expiredContainers) {
        await this.cleanupContainer(containerId)
      }
    }
  }

  /**
   * Get all tracked containers with their expiration times
   */
  static getTrackedContainers(): Array<{ containerId: string; expiresAt: Date }> {
    return Array.from(this.timeouts.values()).map((entry) => ({
      containerId: entry.containerId,
      expiresAt: new Date(entry.expiresAt),
    }))
  }

  /**
   * Stop the cleanup process and clear all timeouts
   * Used for graceful shutdown
   */
  static shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    // Clear all timeout handles
    for (const entry of this.timeouts.values()) {
      if (entry.timeoutHandle) {
        clearTimeout(entry.timeoutHandle)
      }
    }

    this.timeouts.clear()
    this.initialized = false

    console.log('DockerTimeoutManager shutdown')
  }
}

// Auto-initialize if Docker provider is being used
const shouldAutoInit =
  process.env.SANDBOX_PROVIDER === 'docker' ||
  (!process.env.E2B_API_KEY && !process.env.DAYTONA_API_KEY)

if (shouldAutoInit && typeof process !== 'undefined') {
  DockerTimeoutManager.initialize()
}
