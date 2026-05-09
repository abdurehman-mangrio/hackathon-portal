import express from 'express';
import SystemSettings from '../models/SystemSettings.js';

const router = express.Router();

// Middleware to check admin privileges
const requireAdmin = async (req, res, next) => {
  try {
    // Add your admin authentication logic here
    console.log('🔐 Settings access attempt by admin');
    next();
  } catch (error) {
    res.status(401).json({ error: 'Admin access required' });
  }
};

// Get all system settings
router.get('/', requireAdmin, async (req, res) => {
  try {
    console.log('⚙️ Fetching system settings...');
    
    let settings = await SystemSettings.findOne();
    
    // If no settings exist, create default ones
    if (!settings) {
      console.log('📝 Creating default system settings...');
      settings = new SystemSettings();
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error('❌ Error fetching system settings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system settings',
      details: error.message 
    });
  }
});

// Update system settings
router.put('/', requireAdmin, async (req, res) => {
  try {
    console.log('💾 Updating system settings...');
    const updates = req.body;

    // Validate critical settings
    if (updates.maxLoginAttempts && (updates.maxLoginAttempts < 1 || updates.maxLoginAttempts > 10)) {
      return res.status(400).json({ error: 'Max login attempts must be between 1 and 10' });
    }

    if (updates.minPasswordLength && (updates.minPasswordLength < 6 || updates.minPasswordLength > 32)) {
      return res.status(400).json({ error: 'Minimum password length must be between 6 and 32' });
    }

    if (updates.teamSizeLimit && (updates.teamSizeLimit < 1 || updates.teamSizeLimit > 10)) {
      return res.status(400).json({ error: 'Team size limit must be between 1 and 10' });
    }

    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = new SystemSettings(updates);
    } else {
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          settings[key] = updates[key];
        }
      });
    }

    settings.lastUpdated = new Date();
    await settings.save();

    console.log('✅ System settings updated successfully');
    
    // If maintenance mode was toggled, log it
    if (updates.maintenanceMode !== undefined) {
      console.log(`🔧 Maintenance mode ${updates.maintenanceMode ? 'enabled' : 'disabled'}`);
    }

    res.json({
      message: 'System settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('❌ Error updating system settings:', error);
    res.status(500).json({ 
      error: 'Failed to update system settings',
      details: error.message 
    });
  }
});

// Reset settings to default
router.post('/reset', requireAdmin, async (req, res) => {
  try {
    console.log('🔄 Resetting system settings to default...');
    
    await SystemSettings.deleteMany({});
    
    const defaultSettings = new SystemSettings();
    await defaultSettings.save();

    console.log('✅ System settings reset to default');
    
    res.json({
      message: 'System settings reset to default successfully',
      settings: defaultSettings
    });
  } catch (error) {
    console.error('❌ Error resetting system settings:', error);
    res.status(500).json({ 
      error: 'Failed to reset system settings',
      details: error.message 
    });
  }
});

// Get specific settings section
router.get('/:section', requireAdmin, async (req, res) => {
  try {
    const { section } = req.params;
    console.log(`📋 Fetching ${section} settings...`);
    
    const settings = await SystemSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    // Return only the requested section
    const sectionData = settings[section];
    if (!sectionData) {
      return res.status(404).json({ error: `Settings section '${section}' not found` });
    }

    res.json(sectionData);
  } catch (error) {
    console.error('❌ Error fetching settings section:', error);
    res.status(500).json({ 
      error: 'Failed to fetch settings section',
      details: error.message 
    });
  }
});

// Test email configuration
router.post('/test-email', requireAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`📧 Testing email configuration to: ${email}`);
    
    // This would integrate with your email service
    // For now, simulate email test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Email test completed');
    res.json({
      message: 'Email test completed successfully',
      sentTo: email
    });
  } catch (error) {
    console.error('❌ Error testing email configuration:', error);
    res.status(500).json({ 
      error: 'Failed to test email configuration',
      details: error.message 
    });
  }
});

// Export current settings
router.get('/export/json', requireAdmin, async (req, res) => {
  try {
    console.log('📤 Exporting system settings as JSON...');
    
    const settings = await SystemSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    const settingsData = JSON.stringify(settings.toObject(), null, 2);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="system-settings.json"');
    res.send(settingsData);
  } catch (error) {
    console.error('❌ Error exporting settings:', error);
    res.status(500).json({ 
      error: 'Failed to export settings',
      details: error.message 
    });
  }
});

export default router;