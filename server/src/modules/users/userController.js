import User from '../../models/User.js';
import Shop from '../../models/Shop.js';
import Master from '../../models/Master.js';
import Tailor from '../../models/Tailor.js';
import DeliveryBoy from '../../models/DeliveryBoy.js';
import { logAudit } from '../../services/auditService.js';

// @desc    Get all users with filtering and pagination
// @route   GET /api/v1/admin/users or /api/users
// @access  Private (SUPER_ADMIN)
export const getUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role.toUpperCase();
    if (status) query.status = status.toUpperCase();
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: users,
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

// @desc    Get user by ID
// @route   GET /api/v1/admin/users/:id
// @access  Private (SUPER_ADMIN)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user status (ACTIVE, SUSPENDED, INACTIVE, BLOCKED)
// @route   PATCH /api/v1/admin/users/:id/status
// @access  Private (SUPER_ADMIN)
export const updateUserStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!['ACTIVE', 'SUSPENDED', 'INACTIVE', 'BLOCKED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const prevStatus = user.status;
    user.status = status;
    await user.save();

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: `USER_STATUS_${status}`,
      module: 'USERS',
      entityType: 'User',
      entityId: user._id,
      oldData: { status: prevStatus },
      newData: { status, reason },
      req
    });

    res.json({ success: true, message: `User status changed to ${status}`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
