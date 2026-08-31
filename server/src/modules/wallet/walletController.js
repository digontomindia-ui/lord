import Wallet from '../../models/Wallet.js';
import WalletTransaction from '../../models/WalletTransaction.js';
import WithdrawalRequest from '../../models/WithdrawalRequest.js';
import { getOrCreateWallet, creditWallet, debitWallet } from '../../services/walletService.js';
import { logAudit } from '../../services/auditService.js';

// @desc    Get authenticated user's wallet
// @route   GET /api/v1/wallet or /api/wallet
// @access  Private
export const getMyWallet = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    res.json({ success: true, data: wallet });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching wallet', error: error.message });
  }
};

// @desc    Get paginated wallet transactions
// @route   GET /api/v1/wallet/transactions or /api/wallet/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, walletType, type } = req.query;
    const query = { userId: req.user._id };

    if (walletType) query.walletType = walletType.toUpperCase();
    if (type) query.type = type.toUpperCase();

    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      WalletTransaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      WalletTransaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request a payout withdrawal
// @route   POST /api/v1/wallet/withdrawals or /api/wallet/withdraw
// @access  Private
export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, walletType = 'MAIN', payoutDetails } = req.body;
    const withdrawalAmount = Number(amount);

    if (!withdrawalAmount || withdrawalAmount < 500) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is ₹500' });
    }

    const wallet = await getOrCreateWallet(req.user._id);

    // 1. Lock/Debit balance immediately to prevent double withdrawal race conditions
    await debitWallet({
      userId: req.user._id,
      walletType,
      amount: withdrawalAmount,
      referenceType: 'WITHDRAWAL_REQUEST',
      description: `Withdrawal payout request of ₹${withdrawalAmount} (Pending approval)`
    });

    // 2. Create pending withdrawal request
    const withdrawal = await WithdrawalRequest.create({
      userId: req.user._id,
      walletId: wallet._id,
      amount: withdrawalAmount,
      payoutDetails: payoutDetails || { note: 'Default account payout' },
      status: 'PENDING'
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal requested successfully',
      data: withdrawal
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get withdrawal requests
// @route   GET /api/v1/wallet/withdrawals or /api/admin/withdrawals
// @access  Private
export const getWithdrawals = async (req, res) => {
  try {
    const query = req.user.role === 'SUPER_ADMIN' ? {} : { userId: req.user._id };
    const withdrawals = await WithdrawalRequest.find(query)
      .populate('userId', 'name mobile role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: withdrawals.length, data: withdrawals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve withdrawal payout (Super Admin only)
// @route   POST /api/v1/admin/withdrawals/:id/approve
// @access  Private (SUPER_ADMIN)
export const approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await WithdrawalRequest.findById(req.params.id);
    if (!withdrawal || withdrawal.status !== 'PENDING') {
      return res.status(404).json({ success: false, message: 'Pending withdrawal request not found' });
    }

    withdrawal.status = 'APPROVED';
    withdrawal.processedBy = req.user._id;
    withdrawal.processedAt = new Date();
    withdrawal.adminNote = req.body.adminNote || 'Payout approved and dispatched';
    await withdrawal.save();

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: 'WITHDRAWAL_APPROVE',
      module: 'FINANCIAL',
      entityType: 'WithdrawalRequest',
      entityId: withdrawal._id,
      newData: { amount: withdrawal.amount, status: 'APPROVED' },
      req
    });

    res.json({ success: true, message: 'Withdrawal approved successfully', data: withdrawal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject withdrawal payout and refund balance (Super Admin only)
// @route   POST /api/v1/admin/withdrawals/:id/reject
// @access  Private (SUPER_ADMIN)
export const rejectWithdrawal = async (req, res) => {
  try {
    const { reason } = req.body;
    const withdrawal = await WithdrawalRequest.findById(req.params.id);
    if (!withdrawal || withdrawal.status !== 'PENDING') {
      return res.status(404).json({ success: false, message: 'Pending withdrawal request not found' });
    }

    withdrawal.status = 'REJECTED';
    withdrawal.processedBy = req.user._id;
    withdrawal.processedAt = new Date();
    withdrawal.adminNote = reason || 'Payout rejected by Admin';
    await withdrawal.save();

    // Refund the debited amount back to user's wallet
    await creditWallet({
      userId: withdrawal.userId,
      walletType: 'MAIN',
      amount: withdrawal.amount,
      referenceType: 'WITHDRAWAL_REJECTED_REFUND',
      referenceId: withdrawal._id,
      description: `Refund for rejected withdrawal: ${reason || 'Admin rejection'}`
    });

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: 'WITHDRAWAL_REJECT',
      module: 'FINANCIAL',
      entityType: 'WithdrawalRequest',
      entityId: withdrawal._id,
      newData: { amount: withdrawal.amount, status: 'REJECTED', reason },
      req
    });

    res.json({ success: true, message: 'Withdrawal rejected and balance refunded', data: withdrawal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin manual wallet adjustment (Credit/Debit)
// @route   POST /api/v1/admin/wallets/:userId/credit or /debit
// @access  Private (SUPER_ADMIN)
export const adminAdjustWallet = async (req, res) => {
  try {
    const { amount, walletType = 'MAIN', type = 'CREDIT', reason } = req.body;
    if (!amount || !reason) {
      return res.status(400).json({ success: false, message: 'Amount and justification reason are mandatory' });
    }

    let tx;
    if (type.toUpperCase() === 'DEBIT') {
      tx = await debitWallet({
        userId: req.params.userId,
        walletType,
        amount: Number(amount),
        referenceType: 'ADMIN_ADJUSTMENT',
        description: `Admin Debit Adjustment: ${reason}`
      });
    } else {
      tx = await creditWallet({
        userId: req.params.userId,
        walletType,
        amount: Number(amount),
        referenceType: 'ADMIN_ADJUSTMENT',
        description: `Admin Credit Adjustment: ${reason}`
      });
    }

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: `WALLET_ADMIN_${type.toUpperCase()}`,
      module: 'FINANCIAL',
      entityType: 'WalletTransaction',
      entityId: tx._id,
      newData: { targetUserId: req.params.userId, amount, walletType, reason },
      req
    });

    res.json({ success: true, message: `Wallet ${type} adjustment completed`, data: tx });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
