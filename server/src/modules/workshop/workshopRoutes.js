import express from 'express';
import { 
  getReceivingQueue, 
  acceptReceiving, 
  submitInspection, 
  getMasterTailors, 
  assignTailor, 
  getQCQueue, 
  approveQC, 
  failQC 
} from './workshopController.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['MASTER', 'SUPER_ADMIN']));

router.get('/receiving', getReceivingQueue);
router.post('/receiving/:orderId/accept', acceptReceiving);
router.post('/inspections/:orderId', submitInspection);
router.get('/tailors', getMasterTailors);
router.post('/orders/:orderId/assign-tailor', assignTailor);
router.get('/qc', getQCQueue);
router.post('/qc/:orderId/approve', approveQC);
router.post('/qc/:orderId/fail', failQC);

export default router;
