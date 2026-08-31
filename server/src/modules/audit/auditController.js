import AuditLog from '../../models/AuditLog.js';

// @desc    Get audit logs (Super Admin only)
// @route   GET /api/v1/admin/audit-logs
// @access  Private (SUPER_ADMIN)
export const getAuditLogs = async (req, res) => {
  try {
    const { module, role, page = 1, limit = 50 } = req.query;
    const query = {};

    if (module) query.module = module.toUpperCase();
    if (role) query.role = role.toUpperCase();

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name mobile role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
