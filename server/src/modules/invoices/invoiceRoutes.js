import express from 'express';
import { getInvoices, getInvoiceById, generateInvoice, downloadInvoicePDF } from './invoiceController.js';
import { requireAuth } from '../../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getInvoices);
router.post('/generate', generateInvoice);
router.get('/:id', getInvoiceById);
router.get('/:id/pdf', downloadInvoicePDF);

export default router;
