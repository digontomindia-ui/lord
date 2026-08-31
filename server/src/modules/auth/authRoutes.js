import express from 'express';
import { 
  login, 
  refreshToken, 
  getMe, 
  updateProfile, 
  changePassword, 
  register, 
  seedAccounts 
} from './authController.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = express.Router();

// Public auth endpoints
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/seed', seedAccounts);
router.get('/seed', seedAccounts);

// Protected authenticated user endpoints
router.get('/me', requireAuth, getMe);
router.patch('/profile', requireAuth, updateProfile);
router.patch('/password', requireAuth, changePassword);
router.patch('/profile/password', requireAuth, changePassword);

// Super Admin user registration
router.post('/register', requireAuth, requireRole(['SUPER_ADMIN']), register);

export default router;
