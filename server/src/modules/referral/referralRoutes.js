import express from 'express';
import { getMyTree, getReferralCode, getCommissionHistory } from './referralController.js';
import { requireAuth } from '../../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/team', getMyTree);
router.get('/me/tree', getMyTree);
router.get('/referral-code', getReferralCode);
router.get('/commissions', getCommissionHistory);
router.get('/income', getCommissionHistory);

export default router;
