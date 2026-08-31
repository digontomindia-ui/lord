import express from 'express';
import { 
  getMyNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  broadcastNotification 
} from './notificationController.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);
router.post('/broadcast', requireRole(['SUPER_ADMIN']), broadcastNotification);

export default router;
