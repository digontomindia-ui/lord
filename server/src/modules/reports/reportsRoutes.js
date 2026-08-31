import express from 'express';
import { getOrderStats, getRevenueReport, getShopReport } from './reportsController.js';
import { requireAuth } from '../../middleware/auth.js';
import { scopeToTenant } from '../../middleware/tenantScope.js';
import { requireRole } from '../../middleware/rbac.js';

const router = express.Router();

router.use(requireAuth);
router.use(scopeToTenant);

router.get('/orders', getOrderStats);
router.get('/revenue', getRevenueReport);
router.get('/shop', requireRole(['SUPER_ADMIN']), getShopReport);

export default router;
