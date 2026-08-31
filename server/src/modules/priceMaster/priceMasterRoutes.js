import express from 'express';
import { getPrices, savePrice, getPriceHistory } from './priceMasterController.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getPrices);
router.post('/', requireRole(['SUPER_ADMIN']), savePrice);
router.patch('/', requireRole(['SUPER_ADMIN']), savePrice);
router.get('/:id/history', requireRole(['SUPER_ADMIN']), getPriceHistory);

export default router;
