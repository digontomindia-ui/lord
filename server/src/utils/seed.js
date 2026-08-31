import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import PriceMaster from '../models/PriceMaster.js';

export const autoSeedDatabase = async () => {
  try {
    const adminExists = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!adminExists) {
      console.log('No Super Admin found. Auto-seeding initial ERP accounts...');
      
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('password123', salt);

      // 1. Super Admin
      await User.create({
        name: 'System Admin',
        mobile: '9999999999',
        passwordHash,
        role: 'SUPER_ADMIN',
        status: 'active'
      });

      // 2. Shops
      await User.create({ name: 'Shop One', mobile: '9000000001', passwordHash, role: 'SHOP', status: 'active', profile: { address: '123 Market St' } });
      await User.create({ name: 'Shop Two', mobile: '9000000002', passwordHash, role: 'SHOP', status: 'active', profile: { address: '456 High St' } });

      // 3. Masters
      const master1 = await User.create({ name: 'Master Ali', mobile: '8000000001', passwordHash, role: 'MASTER', status: 'active', profile: { workshopName: 'Premium Alters' } });
      const master2 = await User.create({ name: 'Master Raj', mobile: '8000000002', passwordHash, role: 'MASTER', status: 'active', profile: { workshopName: 'Quick Fixers' } });

      // 4. Tailors (assigned to masters via uplineId)
      await User.create({ name: 'Tailor John', mobile: '7000000001', passwordHash, role: 'TAILOR', status: 'active', uplineId: master1._id });
      await User.create({ name: 'Tailor Sam', mobile: '7000000002', passwordHash, role: 'TAILOR', status: 'active', uplineId: master1._id });
      await User.create({ name: 'Tailor Bob', mobile: '7000000003', passwordHash, role: 'TAILOR', status: 'active', uplineId: master2._id });
      await User.create({ name: 'Tailor Dan', mobile: '7000000004', passwordHash, role: 'TAILOR', status: 'active', uplineId: master2._id });

      // 5. Delivery Boys
      await User.create({ name: 'Delivery Fast', mobile: '6000000001', passwordHash, role: 'DELIVERY_BOY', status: 'active' });
      await User.create({ name: 'Delivery Express', mobile: '6000000002', passwordHash, role: 'DELIVERY_BOY', status: 'active' });

      console.log('ERP default users auto-seeded successfully!');
    }

    // Auto-seed PriceMaster if empty
    const priceCount = await PriceMaster.countDocuments();
    if (priceCount === 0) {
      console.log('Seeding default Price Master catalogue...');
      const defaultPrices = [
        { garmentType: 'Shirt', alterationType: 'Sleeve Length', urgencyTier: 'Normal', price: 150 },
        { garmentType: 'Shirt', alterationType: 'Chest Fitting', urgencyTier: 'Normal', price: 200 },
        { garmentType: 'Pant', alterationType: 'Length Shorten', urgencyTier: 'Normal', price: 120 },
        { garmentType: 'Pant', alterationType: 'Waist Alteration', urgencyTier: 'Normal', price: 180 },
        { garmentType: 'Suit', alterationType: 'Full Alteration', urgencyTier: 'Normal', price: 800 },
        { garmentType: 'Shirt', alterationType: 'Sleeve Length', urgencyTier: 'Urgent', price: 250 },
        { garmentType: 'Pant', alterationType: 'Length Shorten', urgencyTier: 'Urgent', price: 200 }
      ];
      await PriceMaster.insertMany(defaultPrices);
      console.log('Price Master catalogue seeded successfully!');
    }
  } catch (error) {
    console.error('Auto-seed error:', error.message);
  }
};

// Standalone seed CLI runner
const runCli = async () => {
  if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tailor_erp';
    await mongoose.connect(MONGODB_URI);
    await autoSeedDatabase();
    process.exit();
  }
};

runCli();
