import express from 'express';
import { 
  createOrder, 
  getOrders, 
  getOrderById, 
  getOrderTimeline, 
  requestPickup, 
  cancelOrder, 
  transitionOrder 
} from './orderController.js';
import { requireAuth } from '../../middleware/auth.js';
import { scopeToTenant } from '../../middleware/tenantScope.js';

const router = express.Router();

router.use(requireAuth);
router.use(scopeToTenant);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.get('/:id/timeline', getOrderTimeline);
router.post('/:id/pickup-request', requestPickup);
router.post('/:id/cancel', cancelOrder);
router.patch('/:id/transition', transitionOrder);
router.post('/:id/transition', transitionOrder);

export default router;
