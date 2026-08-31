import express from 'express';
import { 
  getMyWallet, 
  getTransactions, 
  requestWithdrawal, 
  getWithdrawals, 
  approveWithdrawal, 
  rejectWithdrawal, 
  adminAdjustWallet 
} from './walletController.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = express.Router();

router.use(requireAuth);

// User Wallet Endpoints
router.get('/', getMyWallet);
router.get('/me', getMyWallet);
router.get('/balances', getMyWallet);
router.get('/transactions', getTransactions);
router.post('/withdrawals', requestWithdrawal);
router.post('/withdraw', requestWithdrawal);
router.get('/withdrawals', getWithdrawals);

// Admin Wallet Endpoints
router.post('/admin/withdrawals/:id/approve', requireRole(['SUPER_ADMIN']), approveWithdrawal);
router.post('/admin/withdrawals/:id/reject', requireRole(['SUPER_ADMIN']), rejectWithdrawal);
router.post('/admin/wallets/:userId/credit', requireRole(['SUPER_ADMIN']), (req, res, next) => { req.body.type = 'CREDIT'; next(); }, adminAdjustWallet);
router.post('/admin/wallets/:userId/debit', requireRole(['SUPER_ADMIN']), (req, res, next) => { req.body.type = 'DEBIT'; next(); }, adminAdjustWallet);

export default router;
