import express from 'express';
import { getAuditLogs } from './auditController.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN']));

router.get('/', getAuditLogs);

export default router;
