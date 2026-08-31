import express from 'express';
import { login, register, seedAccounts } from './authController.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = express.Router();

router.post('/login', login);
router.post('/seed', seedAccounts);
router.get('/seed', seedAccounts);

// Only SUPER_ADMIN can register new users in the ERP
router.post('/register', requireAuth, requireRole(['SUPER_ADMIN']), register);

export default router;

