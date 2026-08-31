import express from 'express';
import { getPrices, savePrice, updatePriceById, deletePrice, getPriceHistory } from './priceMasterController.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = express.Router();

// Public / Authenticated route to view rates
router.get('/', getPrices);

// Super Admin protected management routes
router.post('/', requireAuth, requireRole(['SUPER_ADMIN']), savePrice);
router.put('/:id', requireAuth, requireRole(['SUPER_ADMIN']), updatePriceById);
router.patch('/:id', requireAuth, requireRole(['SUPER_ADMIN']), updatePriceById);
router.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN']), deletePrice);
router.get('/:id/history', requireAuth, requireRole(['SUPER_ADMIN']), getPriceHistory);

export default router;
