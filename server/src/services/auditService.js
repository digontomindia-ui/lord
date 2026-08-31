// auditService.js
// Non-repudiation audit logging service for compliance and security

import AuditLog from '../models/AuditLog.js';

export const logAudit = async ({ userId, role, action, module, entityType, entityId, oldData, newData, req }) => {
  try {
    await AuditLog.create({
      userId,
      role: role || 'SYSTEM',
      action,
      module,
      entityType,
      entityId,
      oldData,
      newData,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1',
      userAgent: req?.headers?.['user-agent'] || 'System'
    });
  } catch (error) {
    console.error('Audit logging error:', error.message);
  }
};
