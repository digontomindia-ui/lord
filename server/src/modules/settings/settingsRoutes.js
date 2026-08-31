import express from 'express';
import { getSettings, updateSetting } from './settingsController.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getSettings);
router.put('/:key', requireRole(['SUPER_ADMIN']), updateSetting);

export default router;
