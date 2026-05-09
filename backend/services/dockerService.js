import Docker from 'dockerode'
import { randomBytes } from 'crypto'

const docker = new Docker()

export class DockerChallengeManager {
  constructor() {
    this.activeContainers = new Map()
  }

  async spawnChallengeInstance(userId, challengeId, challengeConfig) {
    const containerName = `user-${userId}-challenge-${challengeId}-${randomBytes(8).toString('hex')}`
    
    try {
      const container = await docker.createContainer({
        Image: challengeConfig.image,
        name: containerName,
        HostConfig: {
          Memory: challengeConfig.memoryLimit || 256 * 1024 * 1024,
          MemorySwap: challengeConfig.memoryLimit || 256 * 1024 * 1024,
          CpuShares: 1024,
          PidsLimit: 100,
          NetworkMode: 'none', // Isolated network
          AutoRemove: true,
          ReadonlyRootfs: true // Read-only filesystem
        },
        Env: challengeConfig.environment || [],
        Cmd: challengeConfig.command || [],
        WorkingDir: challengeConfig.workingDir || '/app'
      })

      await container.start()

      // Store container info
      this.activeContainers.set(`${userId}-${challengeId}`, {
        containerId: container.id,
        name: containerName,
        startedAt: new Date()
      })

      // Get container info
      const info = await container.inspect()
      
      return {
        containerId: container.id,
        status: 'running',
        ports: challengeConfig.ports || [],
        expiresAt: new Date(Date.now() + (challengeConfig.timeout || 3600) * 1000)
      }

    } catch (error) {
      console.error('Failed to spawn container:', error)
      throw new Error('Failed to start challenge instance')
    }
  }

  async stopChallengeInstance(userId, challengeId) {
    const key = `${userId}-${challengeId}`
    const containerInfo = this.activeContainers.get(key)
    
    if (!containerInfo) return

    try {
      const container = docker.getContainer(containerInfo.containerId)
      await container.stop({ t: 10 }) // 10 second timeout
      await container.remove()
      
      this.activeContainers.delete(key)
    } catch (error) {
      console.error('Failed to stop container:', error)
    }
  }

  async cleanupExpiredContainers() {
    const now = new Date()
    
    for (const [key, containerInfo] of this.activeContainers.entries()) {
      if (containerInfo.expiresAt && containerInfo.expiresAt < now) {
        await this.stopChallengeInstance(
          key.split('-')[0], 
          key.split('-')[1]
        )
      }
    }
  }

  async getContainerLogs(containerId, tail = 100) {
    try {
      const container = docker.getContainer(containerId)
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: tail,
        timestamps: true
      })
      
      return logs.toString()
    } catch (error) {
      console.error('Failed to get container logs:', error)
      return ''
    }
  }

  async getContainerStats(containerId) {
    try {
      const container = docker.getContainer(containerId)
      const stats = await container.stats({ stream: false })
      
      return {
        cpu: stats.cpu_stats,
        memory: stats.memory_stats,
        network: stats.networks
      }
    } catch (error) {
      console.error('Failed to get container stats:', error)
      return null
    }
  }
}

export default new DockerChallengeManager()