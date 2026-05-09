import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { createWriteStream } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class BackupManager {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.maxBackupSize = 1024 * 1024 * 1024; // 1GB
  }

  async ensureBackupDir() {
    try {
      await fs.access(this.backupDir);
      console.log('✅ Backup directory exists:', this.backupDir);
    } catch {
      console.log('📁 Creating backup directory:', this.backupDir);
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log('✅ Backup directory created');
    }
  }

  async createBackup() {
    await this.ensureBackupDir();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}`;
    const jsonPath = path.join(this.backupDir, `${backupName}.json`);
    const zipPath = path.join(this.backupDir, `${backupName}.zip`);

    try {
      console.log('📦 Starting backup creation...');

      // Try to import models - handle if they don't exist
      let models = {};
      try {
        const User = (await import('../models/User.js')).default;
        const Challenge = (await import('../models/Challenge.js')).default;
        const Submission = (await import('../models/Submission.js')).default;
        const Team = (await import('../models/Team.js')).default;
        const Achievement = (await import('../models/Achievement.js')).default;

        models = { User, Challenge, Submission, Team, Achievement };
        console.log('✅ All models loaded successfully');
      } catch (modelError) {
        console.log('⚠️ Some models not available, using mock data:', modelError.message);
        // Use mock data if models aren't available
        models = {};
      }

      // Collect data from available models
      const backupData = {
        metadata: {
          version: '1.0',
          timestamp: new Date(),
          platform: 'CTF-Hackathon',
          collections: []
        },
        data: {},
        statistics: {}
      };

      // Try to fetch data from each model
      for (const [modelName, Model] of Object.entries(models)) {
        try {
          if (Model && typeof Model.find === 'function') {
            backupData.data[modelName.toLowerCase()] = await Model.find().lean();
            backupData.statistics[`total${modelName}`] = await Model.countDocuments();
            backupData.metadata.collections.push(modelName.toLowerCase());
            console.log(`✅ Collected ${modelName} data`);
          }
        } catch (error) {
          console.log(`⚠️ Failed to collect ${modelName} data:`, error.message);
        }
      }

      // If no data was collected, create a basic backup
      if (backupData.metadata.collections.length === 0) {
        console.log('ℹ️ No database data available, creating basic backup');
        backupData.data = { message: 'No database collections available' };
        backupData.statistics = { totalRecords: 0 };
      }

      console.log('💾 Writing JSON backup...');
      await fs.writeFile(jsonPath, JSON.stringify(backupData, null, 2));

      console.log('🗜️ Creating compressed backup...');
      await this.createZipFile(jsonPath, zipPath);

      // Remove temporary JSON file
      await fs.unlink(jsonPath);

      // Verify backup file
      const stats = await fs.stat(zipPath);
      console.log(`✅ Backup created successfully: ${path.basename(zipPath)} (${this.formatFileSize(stats.size)})`);

      return zipPath;

    } catch (error) {
      // Cleanup on error
      try {
        await fs.unlink(jsonPath).catch(() => {});
        await fs.unlink(zipPath).catch(() => {});
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      
      console.error('❌ Backup creation failed:', error);
      throw error;
    }
  }

  async createZipFile(sourcePath, zipPath) {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(zipPath);
      const archive = archiver('zip', { 
        zlib: { level: 9 } // Maximum compression
      });

      output.on('close', () => {
        console.log(`📦 Zip file created: ${archive.pointer()} total bytes`);
        resolve(zipPath);
      });

      archive.on('error', (error) => {
        console.error('Zip creation error:', error);
        reject(error);
      });

      archive.on('warning', (warning) => {
        console.warn('Zip warning:', warning);
      });

      archive.pipe(output);
      archive.file(sourcePath, { name: 'backup.json' });
      archive.finalize();
    });
  }

  async listBackups() {
    try {
      await this.ensureBackupDir();
      
      const files = await fs.readdir(this.backupDir);
      console.log(`📁 Found ${files.length} files in backup directory`);

      const backups = [];

      for (const file of files) {
        if (file.endsWith('.zip')) {
          try {
            const filePath = path.join(this.backupDir, file);
            const stats = await fs.stat(filePath);
            
            // Parse timestamp from filename
            const timestampMatch = file.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
            const created = timestampMatch ? 
              new Date(timestampMatch[1].replace(/-/g, ':')) : 
              stats.birthtime;

            backups.push({
              filename: file,
              path: filePath,
              created: created,
              size: stats.size,
              type: file.includes('auto-') ? 'automatic' : 'manual'
            });

            console.log(`✅ Found backup: ${file} (${this.formatFileSize(stats.size)})`);
          } catch (fileError) {
            console.error(`❌ Error processing backup file ${file}:`, fileError.message);
          }
        }
      }

      // Sort by creation date (newest first)
      const sortedBackups = backups.sort((a, b) => b.created - a.created);
      console.log(`📊 Returning ${sortedBackups.length} valid backups`);
      
      return sortedBackups;
    } catch (error) {
      console.error('❌ Failed to list backups:', error);
      return [];
    }
  }

  async cleanupOldBackups(retentionDays = 30) {
    try {
      const backups = await this.listBackups();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - retentionDays);

      let deletedCount = 0;
      let totalFreed = 0;

      for (const backup of backups) {
        if (backup.created < cutoff) {
          try {
            await fs.unlink(backup.path);
            console.log(`🗑️ Deleted old backup: ${backup.filename}`);
            deletedCount++;
            totalFreed += backup.size;
          } catch (error) {
            console.error(`Failed to delete backup ${backup.filename}:`, error);
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`✅ Cleanup completed: Deleted ${deletedCount} backups, freed ${this.formatFileSize(totalFreed)}`);
      } else {
        console.log('ℹ️ No old backups to clean up');
      }

      return { deletedCount, freedSpace: totalFreed };
    } catch (error) {
      console.error('❌ Backup cleanup failed:', error);
      throw error;
    }
  }

  async getBackupStats() {
    const backups = await this.listBackups();
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    const automaticCount = backups.filter(b => b.type === 'automatic').length;
    const manualCount = backups.filter(b => b.type === 'manual').length;

    return {
      totalBackups: backups.length,
      totalSize,
      automaticCount,
      manualCount,
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].created : null,
      newestBackup: backups.length > 0 ? backups[0].created : null
    };
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Create and export singleton instance
const backupManager = new BackupManager();
export default backupManager;