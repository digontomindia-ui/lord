import express from 'express';
import { 
  login, 
  refreshToken, 
  getMe, 
  updateProfile, 
  changePassword, 
  register, 
  seedAccounts,
  forgotPassword,
  verifyOTP,
  resetPassword,
  logout
} from './authController.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = express.Router();

// Public auth endpoints
router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refreshToken);
router.post('/seed', seedAccounts);
router.get('/seed', seedAccounts);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.post('/logout', logout);

// Protected authenticated user endpoints
router.get('/me', requireAuth, getMe);
router.patch('/profile', requireAuth, updateProfile);
router.patch('/password', requireAuth, changePassword);
router.patch('/profile/password', requireAuth, changePassword);

export default router;
