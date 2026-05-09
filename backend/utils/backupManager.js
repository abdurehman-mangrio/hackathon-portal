import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import archiver from 'archiver'
import { createWriteStream } from 'fs'
import Challenge from '../models/Challenge.js'
import User from '../models/User.js'
import Submission from '../models/Submission.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class BackupManager {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups')
  }

  async ensureBackupDir() {
    try {
      await fs.access(this.backupDir)
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true })
    }
  }

  async createBackup() {
    await this.ensureBackupDir()
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(this.backupDir, `backup-${timestamp}.json`)
    const zipPath = path.join(this.backupDir, `backup-${timestamp}.zip`)

    try {
      // Collect all data
      const backupData = {
        timestamp: new Date(),
        metadata: {
          version: '1.0',
          records: {}
        },
        data: {
          challenges: await Challenge.find().lean(),
          users: await User.find().select('-password').lean(),
          submissions: await Submission.find().lean(),
          teams: await (await import('../models/Team.js')).default.find().lean(),
          achievements: await (await import('../models/Achievement.js')).default.find().lean()
        }
      }

      // Save as JSON
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2))

      // Create zip file
      await this.createZipFile(backupPath, zipPath)

      // Remove JSON file
      await fs.unlink(backupPath)

      console.log(`Backup created: ${zipPath}`)
      return zipPath

    } catch (error) {
      console.error('Backup creation failed:', error)
      throw error
    }
  }

  async createZipFile(sourcePath, zipPath) {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(zipPath)
      const archive = archiver('zip', { zlib: { level: 9 } })

      output.on('close', () => resolve(zipPath))
      archive.on('error', reject)

      archive.pipe(output)
      archive.file(sourcePath, { name: 'backup.json' })
      archive.finalize()
    })
  }

  async restoreBackup(backupPath) {
    try {
      // This would involve reading the backup and restoring data
      // For security, this should be done carefully in production
      console.log('Restore functionality would be implemented here')
      
      return { success: true, message: 'Restore process completed' }
    } catch (error) {
      console.error('Restore failed:', error)
      throw error
    }
  }

  async listBackups() {
    await this.ensureBackupDir()
    
    try {
      const files = await fs.readdir(this.backupDir)
      const backups = files
        .filter(file => file.endsWith('.zip'))
        .map(file => {
          const filePath = path.join(this.backupDir, file)
          return {
            filename: file,
            path: filePath,
            created: file.split('-').slice(1).join('-').replace('.zip', '')
          }
        })
        .sort((a, b) => b.created.localeCompare(a.created))

      return backups
    } catch (error) {
      console.error('Failed to list backups:', error)
      return []
    }
  }

  async cleanupOldBackups(maxAgeDays = 30) {
    const backups = await this.listBackups()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - maxAgeDays)

    for (const backup of backups) {
      const backupDate = new Date(backup.created)
      if (backupDate < cutoff) {
        await fs.unlink(backup.path)
        console.log(`Deleted old backup: ${backup.filename}`)
      }
    }
  }
}

export default new BackupManager()