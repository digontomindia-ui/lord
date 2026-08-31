import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/authRoutes.js';
import orderRoutes from './modules/orders/orderRoutes.js';
import walletRoutes from './modules/wallet/walletRoutes.js';
import priceMasterRoutes from './modules/priceMaster/priceMasterRoutes.js';
import referralRoutes from './modules/referral/referralRoutes.js';
import reportsRoutes from './modules/reports/reportsRoutes.js';
import notificationRoutes from './modules/notifications/notificationRoutes.js';
import ticketRoutes from './modules/helpdesk/ticketRoutes.js';
import { autoSeedDatabase } from './utils/seed.js';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'OK', version: '2.0.0 (Milestone 4)' }));
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/price-master', priceMasterRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tickets', ticketRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    return res.status(400).json({ success: false, message: 'Duplicate field value entered' });
  }

  // Mongoose Cast Error (Bad ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Resource not found or invalid ID format' });
  }

  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Internal Server Error' 
  });
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tailor_erp';
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected successfully to ERP Core');
    await autoSeedDatabase();
  })
  .catch(err => console.log('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
