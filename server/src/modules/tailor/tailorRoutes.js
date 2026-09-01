import express from 'express';
import { 
  getTailorOrders, 
  getTailorPerformance, 
  acceptOrder, 
  startWork, 
  updateProgress, 
  completeWork 
} from './tailorController.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['TAILOR', 'SUPER_ADMIN']));

router.get('/orders', getTailorOrders);
router.get('/performance', getTailorPerformance);
router.post('/orders/:id/accept', acceptOrder);
router.post('/orders/:id/start', startWork);
router.post('/orders/:id/progress', updateProgress);
router.post('/orders/:id/complete', completeWork);

export default router;
