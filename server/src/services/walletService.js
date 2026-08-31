// walletService.js
// Atomic double-entry financial ledger managing the 6-bucket wallet system.

import mongoose from 'mongoose';
import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';

export const getOrCreateWallet = async (userId, session = null) => {
  let wallet;
  if (session) {
    wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) {
      const [newWallet] = await Wallet.create([{ userId }], { session });
      wallet = newWallet;
    }
  } else {
    wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId });
    }
  }
  return wallet;
};

export const creditWallet = async ({ userId, walletType = 'MAIN', amount, referenceType, referenceId, description, idempotencyKey }, externalSession = null) => {
  if (amount <= 0) throw new Error('Credit amount must be greater than zero');
  
  const bucketKey = walletType.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  
  const executeOperation = async (session) => {
    // Check idempotency if key provided
    if (idempotencyKey) {
      const existingTx = await WalletTransaction.findOne({ idempotencyKey }).session(session);
      if (existingTx) return existingTx;
    }
    
    const wallet = await getOrCreateWallet(userId, session);
    const balanceBefore = wallet.balances[bucketKey] || 0;
    const balanceAfter = balanceBefore + amount;

    const [transaction] = await WalletTransaction.create([{
      walletId: wallet._id,
      userId,
      walletType: walletType.toUpperCase(),
      type: 'CREDIT',
      amount,
      balanceBefore,
      balanceAfter,
      referenceType,
      referenceId,
      description: description || `Credited ₹${amount} to ${walletType} wallet`,
      idempotencyKey
    }], { session });

    await Wallet.updateOne(
      { _id: wallet._id },
      { $inc: { [`balances.${bucketKey}`]: amount } },
      { session }
    );

    return transaction;
  };

  if (externalSession) {
    return await executeOperation(externalSession);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await executeOperation(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const debitWallet = async ({ userId, walletType = 'MAIN', amount, referenceType, referenceId, description, idempotencyKey }, externalSession = null) => {
  if (amount <= 0) throw new Error('Debit amount must be greater than zero');
  
  const bucketKey = walletType.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  
  const executeOperation = async (session) => {
    if (idempotencyKey) {
      const existingTx = await WalletTransaction.findOne({ idempotencyKey }).session(session);
      if (existingTx) return existingTx;
    }
    
    const wallet = await getOrCreateWallet(userId, session);
    const balanceBefore = wallet.balances[bucketKey] || 0;
    
    if (balanceBefore < amount) {
      throw new Error(`Insufficient funds in ${walletType} wallet (Available: ₹${balanceBefore}, Required: ₹${amount})`);
    }
    
    const balanceAfter = balanceBefore - amount;

    const [transaction] = await WalletTransaction.create([{
      walletId: wallet._id,
      userId,
      walletType: walletType.toUpperCase(),
      type: 'DEBIT',
      amount,
      balanceBefore,
      balanceAfter,
      referenceType,
      referenceId,
      description: description || `Debited ₹${amount} from ${walletType} wallet`,
      idempotencyKey
    }], { session });

    await Wallet.updateOne(
      { _id: wallet._id },
      { $inc: { [`balances.${bucketKey}`]: -amount } },
      { session }
    );

    return transaction;
  };

  if (externalSession) {
    return await executeOperation(externalSession);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await executeOperation(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
