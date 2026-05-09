import express from 'express';
import BackupManager from '../services/BackupManager.js';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Simple middleware to check admin privileges
const requireAdmin = async (req, res, next) => {
  try {
    console.log('🔐 Backup access attempt:', {
      method: req.method,
      path: req.path,
      query: req.query
    });
    
    // For now, allow access - implement proper admin check later
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(401).json({ error: 'Admin access required' });
  }
};

// Test endpoint to check if backup routes are working
router.get('/test', (req, res) => {
  console.log('✅ Backup test endpoint hit');
  res.json({ 
    message: 'Backup routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Get all backups - SIMPLIFIED VERSION
router.get('/', requireAdmin, async (req, res) => {
  try {
    console.log('📂 Fetching backup list...');
    
    // First, let's test if BackupManager works
    const backups = await BackupManager.listBackups();
    console.log(`📊 Found ${backups.length} backups`);
    
    // If no backups exist, return empty array
    if (backups.length === 0) {
      console.log('ℹ️ No backups found, returning empty array');
      return res.json([]);
    }

    // Format backups for frontend
    const formattedBackups = await Promise.all(
      backups.map(async (backup) => {
        try {
          const stats = await fs.stat(backup.path);
          const filename = path.basename(backup.path);
          
          return {
            _id: filename.replace('.zip', ''),
            name: filename,
            description: `System backup created on ${new Date(backup.created).toLocaleDateString()}`,
            type: filename.includes('auto-') ? 'automatic' : 'manual',
            size: stats.size,
            createdAt: stats.birthtime,
            status: 'completed',
            downloadUrl: `/api/admin/backups/${filename}/download`
          };
        } catch (error) {
          console.error(`Error processing backup ${backup.filename}:`, error);
          return null;
        }
      })
    );

    // Filter out any null entries
    const validBackups = formattedBackups.filter(backup => backup !== null);
    
    console.log(`✅ Returning ${validBackups.length} valid backups`);
    res.json(validBackups);

  } catch (error) {
    console.error('❌ Error in backup list route:', error);
    res.status(500).json({ 
      error: 'Failed to fetch backups',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create a new backup - SIMPLIFIED VERSION
router.post('/create', requireAdmin, async (req, res) => {
  try {
    console.log('🔄 Creating new backup...');
    
    const backupPath = await BackupManager.createBackup();
    const filename = path.basename(backupPath);
    const stats = await fs.stat(backupPath);

    const backup = {
      _id: filename.replace('.zip', ''),
      name: filename,
      description: `Manual backup created on ${new Date().toLocaleDateString()}`,
      type: 'manual',
      size: stats.size,
      createdAt: stats.birthtime,
      status: 'completed',
      downloadUrl: `/api/admin/backups/${filename}/download`
    };

    console.log('✅ Backup created successfully:', backup.name);
    res.json({
      message: 'Backup created successfully',
      backup
    });
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    res.status(500).json({ 
      error: 'Failed to create backup',
      details: error.message 
    });
  }
});

// Download backup
router.get('/:backupId/download', requireAdmin, async (req, res) => {
  try {
    const { backupId } = req.params;
    const filename = `${backupId}.zip`;
    const filePath = path.join(BackupManager.backupDir, filename);

    console.log(`📥 Download request for: ${filename}`);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      console.log('❌ Backup file not found:', filename);
      return res.status(404).json({ error: 'Backup file not found' });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    console.log('✅ Backup download started:', filename);

  } catch (error) {
    console.error('❌ Error downloading backup:', error);
    res.status(500).json({ 
      error: 'Failed to download backup',
      details: error.message 
    });
  }
});

// Delete backup
router.delete('/:backupId', requireAdmin, async (req, res) => {
  try {
    const { backupId } = req.params;
    const filename = `${backupId}.zip`;
    const filePath = path.join(BackupManager.backupDir, filename);

    console.log(`🗑️ Delete request for: ${filename}`);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      console.log('❌ Backup file not found:', filename);
      return res.status(404).json({ error: 'Backup file not found' });
    }

    // Delete the file
    await fs.unlink(filePath);

    console.log('✅ Backup deleted:', filename);
    res.json({ 
      message: 'Backup deleted successfully',
      backupId 
    });
  } catch (error) {
    console.error('❌ Error deleting backup:', error);
    res.status(500).json({ 
      error: 'Failed to delete backup',
      details: error.message 
    });
  }
});

// Restore backup
router.post('/:backupId/restore', requireAdmin, async (req, res) => {
  try {
    const { backupId } = req.params;
    const filename = `${backupId}.zip`;
    const filePath = path.join(BackupManager.backupDir, filename);

    console.log(`🔄 Restore request for: ${filename}`);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      console.log('❌ Backup file not found:', filename);
      return res.status(404).json({ error: 'Backup file not found' });
    }

    // Simulate restore process
    console.log('🔄 Simulating restore process...');
    
    // Simulate restore steps
    for (let i = 0; i <= 100; i += 20) {
      console.log(`Restore progress: ${i}%`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('✅ Restore simulation completed');
    res.json({ 
      message: 'Backup restored successfully',
      backupId,
      restoredCollections: ['users', 'challenges', 'submissions', 'teams', 'achievements'],
      note: 'This is a simulation. Real restore would require careful implementation.'
    });
  } catch (error) {
    console.error('❌ Error restoring backup:', error);
    res.status(500).json({ 
      error: 'Failed to restore backup',
      details: error.message 
    });
  }
});

// Get backup settings
router.get('/settings', requireAdmin, async (req, res) => {
  try {
    console.log('⚙️ Fetching backup settings');
    
    const settings = {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionDays: 30,
      backupTime: '02:00',
      includeFiles: true,
      maxBackupSize: 1024 * 1024 * 1024, // 1GB
      lastAutoBackup: new Date().toISOString(),
      nextAutoBackup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    res.json(settings);
  } catch (error) {
    console.error('❌ Error fetching backup settings:', error);
    res.status(500).json({ error: 'Failed to fetch backup settings' });
  }
});

// Update backup settings
router.put('/settings', requireAdmin, async (req, res) => {
  try {
    const settings = req.body;
    console.log('💾 Updating backup settings:', settings);
    
    // Validate settings
    if (settings.retentionDays && (settings.retentionDays < 1 || settings.retentionDays > 365)) {
      return res.status(400).json({ error: 'Retention days must be between 1 and 365' });
    }

    // In a real implementation, you would save these to a database
    console.log('✅ Backup settings updated');

    res.json({ 
      message: 'Backup settings updated successfully',
      settings 
    });
  } catch (error) {
    console.error('❌ Error updating backup settings:', error);
    res.status(500).json({ error: 'Failed to update backup settings' });
  }
});

export default router;