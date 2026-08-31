import express from 'express';
import { 
  createCustomer, 
  getCustomers, 
  getCustomerById, 
  updateCustomer, 
  getCustomerOrders 
} from './customerController.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['SHOP', 'SUPER_ADMIN']));

router.post('/', createCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.patch('/:id', updateCustomer);
router.get('/:id/orders', getCustomerOrders);

export default router;
