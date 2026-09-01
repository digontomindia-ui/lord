import express from 'express';
import { 
  getDeliveryTasks, 
  getPickups, 
  getDeliveries, 
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

// Task Queues
router.get('/tasks', getDeliveryTasks);
router.get('/pickups', getPickups);
router.get('/deliveries', getDeliveries);

// Task Actions (Support both /tasks/:id and semantic /pickups/:id, /deliveries/:id)
router.post('/tasks/:id/accept', acceptTask);
router.post('/tasks/:id/arrived', markArrived);
router.post('/tasks/:id/collect', collectGarments);
router.post('/tasks/:id/complete', completeDelivery);

router.post('/pickups/:id/accept', acceptTask);
router.post('/pickups/:id/collect', collectGarments);

router.post('/deliveries/:id/accept', acceptTask);
router.post('/deliveries/:id/complete', completeDelivery);

export default router;
