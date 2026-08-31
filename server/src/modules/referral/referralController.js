import User from '../../models/User.js';
import ReferralCommission from '../../models/ReferralCommission.js';
import { getNextCode } from '../../services/counterService.js';

// Recursive function to build 10-level downline tree
const buildDownline = async (uplineId, currentLevel, maxLevel = 10) => {
  if (currentLevel > maxLevel) return [];

  const children = await User.find({ uplineId }).select('_id name role mobile status createdAt');
  
  const tree = [];
  for (let child of children) {
    const downline = await buildDownline(child._id, currentLevel + 1, maxLevel);
    tree.push({
      ...child.toObject(),
      level: currentLevel,
      downline
    });
  }
  
  return tree;
};

// @desc    Get user's 10-level referral tree
// @route   GET /api/v1/associate/team or /api/referral/me/tree
// @access  Private
export const getMyTree = async (req, res) => {
  try {
    const tree = await buildDownline(req.user._id, 1, 10);
    res.json({ success: true, count: tree.length, data: tree });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching referral tree', error: error.message });
  }
};

// @desc    Get user's referral code & link
// @route   GET /api/v1/associate/referral-code
// @access  Private
export const getReferralCode = async (req, res) => {
  try {
    let user = await User.findById(req.user._id);
    if (!user.referralCode) {
      user.referralCode = await getNextCode('ref', 'REF');
      await user.save();
    }

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink: `https://lordsbespoke.com/register?ref=${user.referralCode}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get referral commission earnings & breakdown
// @route   GET /api/v1/associate/commissions or /api/v1/associate/income
// @access  Private
export const getCommissionHistory = async (req, res) => {
  try {
    const commissions = await ReferralCommission.find({ beneficiaryUserId: req.user._id })
      .populate('sourceUserId', 'name mobile role')
      .populate('orderId', 'orderNumber pricing.total')
      .sort({ createdAt: -1 });

    const totalEarned = commissions.reduce((sum, item) => sum + (item.commissionAmount || 0), 0);

    res.json({
      success: true,
      totalEarned,
      count: commissions.length,
      data: commissions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
