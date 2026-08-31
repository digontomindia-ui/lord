import express from 'express';
import { 
  getUsers, 
  getPendingUsers, 
  approveUser, 
  rejectUser, 
  getUserById, 
  updateUserStatus 
} from './userController.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN']));

router.get('/pending', getPendingUsers);
router.patch('/:id/approve', approveUser);
router.patch('/:id/reject', rejectUser);
router.get('/', getUsers);
router.get('/:id', getUserById);
router.patch('/:id/status', updateUserStatus);

export default router;
