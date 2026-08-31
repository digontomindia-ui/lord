import express from 'express';
import { 
  createTicket, 
  getTickets, 
  getTicketById, 
  replyTicket, 
  resolveTicket 
} from './ticketController.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:id', getTicketById);
router.post('/:id/reply', replyTicket);
router.post('/:id/messages', replyTicket);
router.post('/:id/resolve', requireRole(['SUPER_ADMIN']), resolveTicket);
router.post('/:id/close', requireRole(['SUPER_ADMIN']), (req, res, next) => { req.body.status = 'CLOSED'; next(); }, resolveTicket);

export default router;
