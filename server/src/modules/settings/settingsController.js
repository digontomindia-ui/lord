import SystemSetting from '../../models/SystemSetting.js';
import { logAudit } from '../../services/auditService.js';

// @desc    Get all system settings
// @route   GET /api/v1/settings or /api/v1/admin/settings
// @access  Private
export const getSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.find();
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    res.json({ success: true, data: settingsMap, list: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update system setting
// @route   PUT /api/v1/admin/settings/:key
// @access  Private (SUPER_ADMIN)
export const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    const prev = await SystemSetting.findOne({ key });

    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      { value, description },
      { new: true, upsert: true }
    );

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: 'SYSTEM_SETTING_UPDATE',
      module: 'SETTINGS',
      entityType: 'SystemSetting',
      entityId: setting._id,
      oldData: prev ? { value: prev.value } : null,
      newData: { key, value },
      req
    });

    res.json({ success: true, message: `Setting ${key} updated`, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
