import express from 'express';
import { getInvoices, getInvoiceById, generateInvoice } from './invoiceController.js';
import { requireAuth } from '../../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getInvoices);
router.post('/generate', generateInvoice);
router.get('/:id', getInvoiceById);

export default router;
