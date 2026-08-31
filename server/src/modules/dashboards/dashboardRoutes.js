import express from 'express';
import { 
  getAdminDashboard, 
  getShopDashboard, 
  getMasterDashboard, 
  getTailorDashboard, 
  getDeliveryDashboard 
} from './dashboardController.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = express.Router();

router.use(requireAuth);

router.get('/admin', requireRole(['SUPER_ADMIN']), getAdminDashboard);
router.get('/shop', requireRole(['SHOP', 'SUPER_ADMIN']), getShopDashboard);
router.get('/master', requireRole(['MASTER', 'SUPER_ADMIN']), getMasterDashboard);
router.get('/tailor', requireRole(['TAILOR', 'SUPER_ADMIN']), getTailorDashboard);
router.get('/delivery', requireRole(['DELIVERY_BOY', 'SUPER_ADMIN']), getDeliveryDashboard);

export default router;
