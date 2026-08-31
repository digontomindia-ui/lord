import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import { autoSeedDatabase } from '../../utils/seed.js';
import { logAudit } from '../../services/auditService.js';

export const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_ACCESS_SECRET || 'fallback_access_secret', { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

// @desc    Login user
// @route   POST /api/v1/auth/login or /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ success: false, message: 'Mobile and password are required' });
    }

    const user = await User.findOne({ mobile: mobile.trim() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'SUSPENDED' || user.status === 'BLOCKED' || user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account is suspended or blocked' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = generateTokens(user._id);

    await logAudit({
      userId: user._id,
      role: user.role,
      action: 'USER_LOGIN',
      module: 'AUTH',
      entityType: 'User',
      entityId: user._id,
      req
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          _id: user._id,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          role: user.role,
          status: user.status,
          profile: user.profile,
          referralCode: user.referralCode,
          permissions: user.permissions || []
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh
// @access  Public
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');
    const user = await User.findById(decoded.id);
    if (!user || user.status === 'SUSPENDED' || user.status === 'BLOCKED') {
      return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }

    const tokens = generateTokens(user._id);
    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/v1/auth/me or /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
  }
};

// @desc    Update current user profile
// @route   PATCH /api/v1/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, email, profile } = req.body;
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (profile) user.profile = { ...user.profile, ...profile };

    await user.save();
    res.json({ success: true, message: 'Profile updated successfully', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
  }
};

// @desc    Change password
// @route   PATCH /api/v1/profile/password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error changing password', error: error.message });
  }
};

// @desc    Register a user (Super Admin only or bootstrapping)
// @route   POST /api/v1/auth/register
// @access  Private (Super Admin)
export const register = async (req, res) => {
  try {
    const { name, mobile, email, password, role, profile, uplineId } = req.body;

    const userExists = await User.findOne({ mobile });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this mobile already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'password123', salt);

    const user = await User.create({
      name,
      mobile,
      email,
      passwordHash,
      role: role || 'SHOP',
      profile,
      uplineId
    });

    res.status(201).json({ success: true, data: { _id: user._id, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
  }
};

// @desc    Seed default accounts (if not already seeded)
// @route   POST /api/v1/auth/seed
// @access  Public
export const seedAccounts = async (req, res) => {
  try {
    await autoSeedDatabase();
    res.json({ 
      success: true, 
      message: 'Demo accounts seeded successfully. You can now login with 9999999999 / password123' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Seeding failed', error: error.message });
  }
};
