import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import PriceMaster from '../models/PriceMaster.js';
import SystemSetting from '../models/SystemSetting.js';
import { getOrCreateWallet } from '../services/walletService.js';

dotenv.config();

export const autoSeedDatabase = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const superAdminPassword = 'Milan@721166';
    const superAdminPasswordHash = await bcrypt.hash(superAdminPassword, salt);

    // 1. Single Authoritative Super Admin Account
    let admin = await User.findOne({
      $or: [
        { email: 'admin@loeds.com' },
        { email: 'admin@lords.com' },
        { mobile: '9999999999' }
      ]
    });

    if (!admin) {
      admin = await User.create({
        name: 'Super Admin',
        mobile: '9999999999',
        email: 'admin@loeds.com',
        passwordHash: superAdminPasswordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        referralCode: 'ADMIN-001'
      });
    } else {
      admin.name = 'Super Admin';
      admin.email = 'admin@loeds.com';
      admin.mobile = '9999999999';
      admin.passwordHash = superAdminPasswordHash;
      admin.role = 'SUPER_ADMIN';
      admin.status = 'ACTIVE';
      await admin.save();
    }
    await getOrCreateWallet(admin._id);
    console.log(`[SEED] Super Admin verified: admin@loeds.com / ${superAdminPassword}`);

    // 2. Authoritative Price Master Matrix
    const priceEntries = [
      { garmentType: 'SHIRT', alterationType: 'Sleeve Shortening', normalPrice: 150, urgentPrice: 225, veryUrgentPrice: 300, vipPrice: 375, festivalPrice: 250 },
      { garmentType: 'SHIRT', alterationType: 'Sides Tapering', normalPrice: 180, urgentPrice: 270, veryUrgentPrice: 360, vipPrice: 450, festivalPrice: 300 },
      { garmentType: 'SHIRT', alterationType: 'Collar Replacement', normalPrice: 250, urgentPrice: 375, veryUrgentPrice: 500, vipPrice: 625, festivalPrice: 400 },
      { garmentType: 'PANT', alterationType: 'Length Hemming', normalPrice: 120, urgentPrice: 180, veryUrgentPrice: 240, vipPrice: 300, festivalPrice: 200 },
      { garmentType: 'PANT', alterationType: 'Waist & Seat Alteration', normalPrice: 200, urgentPrice: 300, veryUrgentPrice: 400, vipPrice: 500, festivalPrice: 350 },
      { garmentType: 'PANT', alterationType: 'Leg Slimming / Tapering', normalPrice: 220, urgentPrice: 330, veryUrgentPrice: 440, vipPrice: 550, festivalPrice: 380 },
      { garmentType: 'SUIT', alterationType: 'Complete Suit Fitting', normalPrice: 800, urgentPrice: 1200, veryUrgentPrice: 1600, vipPrice: 2000, festivalPrice: 1400 },
      { garmentType: 'BLAZER', alterationType: 'Jacket Shoulder Adjustment', normalPrice: 650, urgentPrice: 975, veryUrgentPrice: 1300, vipPrice: 1625, festivalPrice: 1100 },
      { garmentType: 'SHERWANI', alterationType: 'Full Royal Fitting', normalPrice: 950, urgentPrice: 1425, veryUrgentPrice: 1900, vipPrice: 2375, festivalPrice: 1600 },
      { garmentType: 'LADIES_WEAR', alterationType: 'Blouse / Dress Fitting', normalPrice: 300, urgentPrice: 450, veryUrgentPrice: 600, vipPrice: 750, festivalPrice: 500 },
      { garmentType: 'REPAIR', alterationType: 'Tear / Patch Work', normalPrice: 100, urgentPrice: 150, veryUrgentPrice: 200, vipPrice: 250, festivalPrice: 180 }
    ];

    for (const p of priceEntries) {
      await PriceMaster.findOneAndUpdate(
        { garmentType: p.garmentType, alterationType: p.alterationType },
        p,
        { upsert: true }
      );
    }

    // 3. System Settings
    await SystemSetting.findOneAndUpdate(
      { key: 'referral_tiers' },
      {
        key: 'referral_tiers',
        value: { 1: 10, 2: 5, 3: 3, 4: 2, 5: 1, 6: 0.5, 7: 0.5, 8: 0.5, 9: 0.5, 10: 0.5 },
        description: '10-level percentage commission distribution'
      },
      { upsert: true }
    );

  } catch (error) {
    console.error('Error during auto-seeding:', error.message);
  }
};
