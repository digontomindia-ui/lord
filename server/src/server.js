import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Import Module Routes
import authRoutes from './modules/auth/authRoutes.js';
import userRoutes from './modules/users/userRoutes.js';
import customerRoutes from './modules/customers/customerRoutes.js';
import orderRoutes from './modules/orders/orderRoutes.js';
import workshopRoutes from './modules/workshop/workshopRoutes.js';
import tailorRoutes from './modules/tailor/tailorRoutes.js';
import deliveryRoutes from './modules/delivery/deliveryRoutes.js';
import priceMasterRoutes from './modules/priceMaster/priceMasterRoutes.js';
import invoiceRoutes from './modules/invoices/invoiceRoutes.js';
import paymentRoutes from './modules/payments/paymentRoutes.js';
import walletRoutes from './modules/wallet/walletRoutes.js';
import referralRoutes from './modules/referral/referralRoutes.js';
import notificationRoutes from './modules/notifications/notificationRoutes.js';
import ticketRoutes from './modules/helpdesk/ticketRoutes.js';
import dashboardRoutes from './modules/dashboards/dashboardRoutes.js';
import reportsRoutes from './modules/reports/reportsRoutes.js';
import settingsRoutes from './modules/settings/settingsRoutes.js';
import auditRoutes from './modules/audit/auditRoutes.js';

import { autoSeedDatabase } from './utils/seed.js';

dotenv.config();

const app = express();

// Security & Parsing Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get(['/api/health', '/api/v1/health'], (req, res) => {
  res.json({ 
    status: 'OK', 
    version: '2.0.0 (PRD v1.1 Complete)',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// REST API v1 Routes (PRD Standard Specification)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', authRoutes);
app.use('/api/v1/admin/users', userRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/shop/customers', customerRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/shop/orders', orderRoutes);
app.use('/api/v1/workshop', workshopRoutes);
app.use('/api/v1/master', workshopRoutes);
app.use('/api/v1/tailor', tailorRoutes);
app.use('/api/v1/delivery', deliveryRoutes);
app.use('/api/v1/prices', priceMasterRoutes);
app.use('/api/v1/admin/prices', priceMasterRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/shop/invoices', invoiceRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/associate', referralRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/support', ticketRoutes);
app.use('/api/v1/dashboards', dashboardRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/admin/settings', settingsRoutes);
app.use('/api/v1/admin/audit-logs', auditRoutes);

// Backward-Compatible API Routes (Ensuring existing Client UI components work seamlessly)
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/price-master', priceMasterRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.stack || err);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({ success: false, message: `Duplicate value entered for ${field}` });
  }

  // Mongoose Cast Error (Bad ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Resource not found or invalid ID format' });
  }

  // State Machine Assertion Error
  if (err.message && err.message.includes('Illegal state transition')) {
    return res.status(409).json({ success: false, message: err.message });
  }

  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Internal Server Error' 
  });
});

// Database Connection & Auto-Seed
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lords_bespoke';
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected successfully to LORD\'S BESPOKE ERP Core');
    await autoSeedDatabase();
  })
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`LORD'S BESPOKE ERP Server running on port ${PORT}`);
});

export default app;
