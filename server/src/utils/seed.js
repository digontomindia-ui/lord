import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Master from '../models/Master.js';
import Tailor from '../models/Tailor.js';
import DeliveryBoy from '../models/DeliveryBoy.js';
import Customer from '../models/Customer.js';
import PriceMaster from '../models/PriceMaster.js';
import SystemSetting from '../models/SystemSetting.js';
import { getOrCreateWallet } from '../services/walletService.js';

dotenv.config();

export const autoSeedDatabase = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('password123', salt);

    // 1. Super Admin
    let admin = await User.findOne({ mobile: '9999999999' });
    if (!admin) {
      admin = await User.create({
        name: 'Lord Bespoke Super Admin',
        mobile: '9999999999',
        email: 'admin@lordsbespoke.com',
        passwordHash: defaultPasswordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        referralCode: 'ADMIN-001'
      });
    } else {
      admin.passwordHash = defaultPasswordHash;
      admin.role = 'SUPER_ADMIN';
      admin.status = 'ACTIVE';
      await admin.save();
    }
    await getOrCreateWallet(admin._id);
    console.log('Verified Super Admin: 9999999999 / password123');

    // 2. Shops
    let shopUser1 = await User.findOne({ mobile: '9000000001' });
    if (!shopUser1) {
      shopUser1 = await User.create({
        name: 'Savile Row Alterations',
        mobile: '9000000001',
        email: 'shop1@lordsbespoke.com',
        passwordHash: defaultPasswordHash,
        role: 'SHOP',
        status: 'ACTIVE',
        referralCode: 'SHP-1001',
        uplineId: admin._id
      });
    } else {
      shopUser1.passwordHash = defaultPasswordHash;
      shopUser1.role = 'SHOP';
      shopUser1.status = 'ACTIVE';
      await shopUser1.save();
    }
    await getOrCreateWallet(shopUser1._id);

    let shop1 = await Shop.findOne({ mobile: '9000000001' });
    if (!shop1) {
      shop1 = await Shop.create({
        userId: shopUser1._id,
        shopCode: 'SHP-1001',
        shopName: 'Savile Row Alterations',
        ownerName: 'Vikram Mehta',
        mobile: '9000000001',
        address: {
          line1: 'Shop 12, High Street Galleria',
          city: 'Mumbai',
          state: 'Maharashtra',
          pinCode: '400001'
        },
        status: 'ACTIVE'
      });

      // Seed a default Customer for Shop 1
      await Customer.create({
        shopId: shop1._id,
        customerCode: 'CST-1001',
        name: 'Rahul Sharma',
        mobile: '9876543210',
        email: 'rahul.sharma@example.com',
        address: {
          line1: 'B-402, Sea View Apartments',
          city: 'Mumbai',
          state: 'Maharashtra',
          pinCode: '400050'
        }
      });
    }

    let shopUser2 = await User.findOne({ mobile: '9000000002' });
    if (!shopUser2) {
      shopUser2 = await User.create({
        name: 'Mayfair Bespoke Tailors',
        mobile: '9000000002',
        email: 'shop2@lordsbespoke.com',
        passwordHash: defaultPasswordHash,
        role: 'SHOP',
        status: 'ACTIVE',
        referralCode: 'SHP-1002',
        uplineId: shopUser1._id
      });
    } else {
      shopUser2.passwordHash = defaultPasswordHash;
      shopUser2.role = 'SHOP';
      shopUser2.status = 'ACTIVE';
      await shopUser2.save();
    }
    await getOrCreateWallet(shopUser2._id);

    let shop2 = await Shop.findOne({ mobile: '9000000002' });
    if (!shop2) {
      await Shop.create({
        userId: shopUser2._id,
        shopCode: 'SHP-1002',
        shopName: 'Mayfair Bespoke Tailors',
        ownerName: 'Anil Kapoor',
        mobile: '9000000002',
        address: {
          line1: 'Shop 4, Palladium Mall',
          city: 'Mumbai',
          state: 'Maharashtra',
          pinCode: '400013'
        },
        status: 'ACTIVE'
      });
    }

    // 3. Masters
    let masterUser1 = await User.findOne({ mobile: '8000000001' });
    if (!masterUser1) {
      masterUser1 = await User.create({
        name: 'Master Rafiq Ahmad',
        mobile: '8000000001',
        email: 'master1@lordsbespoke.com',
        passwordHash: defaultPasswordHash,
        role: 'MASTER',
        status: 'ACTIVE',
        referralCode: 'MST-1001',
        uplineId: admin._id
      });
    } else {
      masterUser1.passwordHash = defaultPasswordHash;
      masterUser1.role = 'MASTER';
      masterUser1.status = 'ACTIVE';
      await masterUser1.save();
    }
    await getOrCreateWallet(masterUser1._id);

    let master1 = await Master.findOne({ mobile: '8000000001' });
    if (!master1) {
      await Master.create({
        userId: masterUser1._id,
        masterCode: 'MST-1001',
        workshopName: 'Central Master Workshop Alpha',
        experience: 25,
        specialization: ['SUIT', 'BLAZER', 'SHERWANI', 'SHIRT', 'PANT'],
        mobile: '8000000001',
        address: {
          line1: 'Unit 101, Industrial Craft Hub',
          city: 'Mumbai',
          state: 'Maharashtra',
          pinCode: '400015'
        },
        status: 'ACTIVE'
      });
    }

    let masterUser2 = await User.findOne({ mobile: '8000000002' });
    if (!masterUser2) {
      masterUser2 = await User.create({
        name: 'Master Ibrahim Khan',
        mobile: '8000000002',
        email: 'master2@lordsbespoke.com',
        passwordHash: defaultPasswordHash,
        role: 'MASTER',
        status: 'ACTIVE',
        referralCode: 'MST-1002',
        uplineId: admin._id
      });
    } else {
      masterUser2.passwordHash = defaultPasswordHash;
      masterUser2.role = 'MASTER';
      masterUser2.status = 'ACTIVE';
      await masterUser2.save();
    }
    await getOrCreateWallet(masterUser2._id);

    let master2 = await Master.findOne({ mobile: '8000000002' });
    if (!master2) {
      await Master.create({
        userId: masterUser2._id,
        masterCode: 'MST-1002',
        workshopName: 'Central Master Workshop Beta',
        experience: 20,
        specialization: ['LADIES_WEAR', 'SUIT', 'SHIRT', 'PANT'],
        mobile: '8000000002',
        address: {
          line1: 'Unit 202, Industrial Craft Hub',
          city: 'Mumbai',
          state: 'Maharashtra',
          pinCode: '400015'
        },
        status: 'ACTIVE'
      });
    }

    // 4. Tailors
    const tailorsData = [
      { name: 'Kareem Tailor (Suits)', mobile: '7000000001', specialization: ['SUIT', 'BLAZER', 'SHERWANI'] },
      { name: 'Sameer Tailor (Shirts/Pants)', mobile: '7000000002', specialization: ['SHIRT', 'PANT'] },
      { name: 'Farooq Tailor (Ladies Wear)', mobile: '7000000003', specialization: ['LADIES_WEAR', 'REPAIR'] },
      { name: 'Tariq Tailor (General)', mobile: '7000000004', specialization: ['SHIRT', 'PANT', 'REPAIR'] }
    ];

    for (let i = 0; i < tailorsData.length; i++) {
      const t = tailorsData[i];
      let tailorUser = await User.findOne({ mobile: t.mobile });
      if (!tailorUser) {
        tailorUser = await User.create({
          name: t.name,
          mobile: t.mobile,
          passwordHash: defaultPasswordHash,
          role: 'TAILOR',
          status: 'ACTIVE',
          referralCode: `TLR-100${i + 1}`,
          uplineId: masterUser1._id
        });
      } else {
        tailorUser.passwordHash = defaultPasswordHash;
        tailorUser.role = 'TAILOR';
        tailorUser.status = 'ACTIVE';
        await tailorUser.save();
      }
      await getOrCreateWallet(tailorUser._id);

      let tailorDoc = await Tailor.findOne({ mobile: t.mobile });
      if (!tailorDoc) {
        await Tailor.create({
          userId: tailorUser._id,
          masterId: masterUser1._id,
          tailorCode: `TLR-100${i + 1}`,
          name: t.name,
          mobile: t.mobile,
          experience: 8 + i,
          specialization: t.specialization,
          status: 'ACTIVE'
        });
      }
    }

    // 5. Delivery Boys
    const deliveryData = [
      { name: 'Ramesh Delivery (South Mumbai)', mobile: '6000000001', vehicle: 'BIKE', vehicleNumber: 'MH-01-AB-1234' },
      { name: 'Suresh Delivery (Western Suburbs)', mobile: '6000000002', vehicle: 'SCOOTER', vehicleNumber: 'MH-02-CD-5678' }
    ];

    for (let i = 0; i < deliveryData.length; i++) {
      const d = deliveryData[i];
      let delUser = await User.findOne({ mobile: d.mobile });
      if (!delUser) {
        delUser = await User.create({
          name: d.name,
          mobile: d.mobile,
          passwordHash: defaultPasswordHash,
          role: 'DELIVERY_BOY',
          status: 'ACTIVE',
          referralCode: `DLV-100${i + 1}`,
          uplineId: admin._id
        });
      } else {
        delUser.passwordHash = defaultPasswordHash;
        delUser.role = 'DELIVERY_BOY';
        delUser.status = 'ACTIVE';
        await delUser.save();
      }
      await getOrCreateWallet(delUser._id);

      let delDoc = await DeliveryBoy.findOne({ mobile: d.mobile });
      if (!delDoc) {
        await DeliveryBoy.create({
          userId: delUser._id,
          deliveryBoyCode: `DLV-100${i + 1}`,
          name: d.name,
          mobile: d.mobile,
          vehicle: { type: d.vehicle, number: d.vehicleNumber },
          licenseNumber: `DL-MH-2022000${i + 1}`,
          address: {
            line1: 'Logistics Hub 5',
            city: 'Mumbai',
            state: 'Maharashtra',
            pinCode: '400010'
          },
          status: 'ACTIVE'
        });
      }
    }

    // 6. Price Master Catalogue
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

    // 7. System Settings
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
