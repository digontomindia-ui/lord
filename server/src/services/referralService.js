// referralService.js
// 10-Level Dynamic Referral Commission Distribution Engine

import User from '../models/User.js';
import ReferralCommission from '../models/ReferralCommission.js';
import SystemSetting from '../models/SystemSetting.js';
import { creditWallet } from './walletService.js';

// Default percentage tiers if not configured in settings
const DEFAULT_COMMISSION_TIERS = {
  1: 10,  // Level 1: 10%
  2: 5,   // Level 2: 5%
  3: 3,   // Level 3: 3%
  4: 2,   // Level 4: 2%
  5: 1,   // Level 5: 1%
  6: 0.5, // Level 6: 0.5%
  7: 0.5, // Level 7: 0.5%
  8: 0.5, // Level 8: 0.5%
  9: 0.5, // Level 9: 0.5%
  10: 0.5 // Level 10: 0.5%
};

export const processReferralCommission = async (orderId, sourceUserId, orderAmount) => {
  try {
    const settingsDoc = await SystemSetting.findOne({ key: 'referral_tiers' });
    const tiers = settingsDoc?.value || DEFAULT_COMMISSION_TIERS;

    let currentUserId = sourceUserId;
    let level = 1;

    while (currentUserId && level <= 10) {
      const currentUser = await User.findById(currentUserId);
      if (!currentUser || !currentUser.uplineId) break;

      const uplineId = currentUser.uplineId;
      const uplineUser = await User.findById(uplineId);
      if (!uplineUser) break;

      const percentage = tiers[level] || 0;
      if (percentage > 0) {
        const commissionAmount = Number(((orderAmount * percentage) / 100).toFixed(2));

        // 1. Record commission entry
        await ReferralCommission.create({
          beneficiaryUserId: uplineId,
          sourceUserId,
          orderId,
          level,
          orderAmount,
          commissionPercentage: percentage,
          commissionAmount,
          status: 'CREDITED'
        });

        // 2. Credit to Upline's Commission Wallet bucket
        await creditWallet({
          userId: uplineId,
          walletType: 'COMMISSION',
          amount: commissionAmount,
          referenceType: 'REFERRAL_COMMISSION',
          referenceId: orderId,
          description: `Level ${level} referral commission for order ₹${orderAmount} (${percentage}%)`
        });
      }

      currentUserId = uplineId;
      level++;
    }
  } catch (error) {
    console.error('Error processing referral commission:', error.message);
  }
};
