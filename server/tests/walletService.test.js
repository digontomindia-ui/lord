import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Wallet from '../src/models/Wallet.js';
import WalletTransaction from '../src/models/WalletTransaction.js';
import { creditWallet, debitWallet, getOrCreateWallet } from '../src/services/walletService.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  await Wallet.deleteMany({});
  await WalletTransaction.deleteMany({});
});

describe('Wallet Service 6-Bucket Atomic Operations', () => {

  test('Wallet is auto-created with 6 balance buckets', async () => {
    const userId = new mongoose.Types.ObjectId();
    const wallet = await getOrCreateWallet(userId);
    
    expect(wallet.balances.main).toBe(0);
    expect(wallet.balances.growth).toBe(0);
    expect(wallet.balances.todaysWork).toBe(0);
    expect(wallet.balances.reward).toBe(0);
    expect(wallet.balances.commission).toBe(0);
    expect(wallet.balances.bonus).toBe(0);
  });

  test('Concurrent credits safely update ledger without loss', async () => {
    const userId = new mongoose.Types.ObjectId();
    await getOrCreateWallet(userId);

    // Fire 5 concurrent credit transactions of 100 each
    const promises = Array(5).fill(0).map((_, i) => 
      creditWallet({
        userId,
        walletType: 'MAIN',
        amount: 100,
        description: `Concurrent Credit Test ${i + 1}`
      })
    );

    await Promise.all(promises);

    const finalWallet = await Wallet.findOne({ userId });
    expect(finalWallet.balances.main).toBe(500);

    const txCount = await WalletTransaction.countDocuments({ userId });
    expect(txCount).toBe(5);
  });

  test('Debit fails atomically if funds are insufficient', async () => {
    const userId = new mongoose.Types.ObjectId();
    
    await Wallet.create({
      userId,
      balances: { main: 50, growth: 0, todaysWork: 0, reward: 0, commission: 0, bonus: 0 }
    });

    await expect(debitWallet({
      userId,
      walletType: 'MAIN',
      amount: 100,
      description: 'Overdraft should fail'
    })).rejects.toThrow('Insufficient funds in MAIN wallet');

    const finalWallet = await Wallet.findOne({ userId });
    expect(finalWallet.balances.main).toBe(50); // Balance untouched
  });
});
