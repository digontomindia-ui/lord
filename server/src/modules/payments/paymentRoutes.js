import express from 'express';
import { recordPayment, getPayments } from './paymentController.js';
import { requireAuth } from '../../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', recordPayment);
router.get('/', getPayments);

export default router;
