import express from 'express';
import { 
  getDeliveryTasks, 
  acceptTask, 
  markArrived, 
  collectGarments, 
  completeDelivery 
} from './deliveryController.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['DELIVERY_BOY', 'SUPER_ADMIN']));

router.get('/tasks', getDeliveryTasks);
router.post('/tasks/:id/accept', acceptTask);
router.post('/tasks/:id/arrived', markArrived);
router.post('/tasks/:id/collect', collectGarments);
router.post('/tasks/:id/complete', completeDelivery);

export default router;
