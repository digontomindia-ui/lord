import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import { autoSeedDatabase } from '../../utils/seed.js';

const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_ACCESS_SECRET || 'fallback_access_secret', { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

// @desc    Register a user (Only Super Admin can do this, except maybe for the first admin bootstrap)
// @route   POST /api/auth/register
// @access  Private (Super Admin)
export const register = async (req, res) => {
  try {
    const { name, mobile, email, password, role, profile } = req.body;

    const userExists = await User.findOne({ mobile });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this mobile already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name, mobile, email, passwordHash, role, profile
    });

    res.status(201).json({ success: true, data: { _id: user._id, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    const user = await User.findOne({ mobile });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is suspended' });
    }

    const tokens = generateTokens(user._id);

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          _id: user._id,
          name: user.name,
          mobile: user.mobile,
          role: user.role,
          profile: user.profile
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
  }
};

// @desc    Seed default accounts (if not already seeded)
// @route   POST /api/auth/seed
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
