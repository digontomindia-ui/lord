// orderStateMachine.js
// Central state machine guarding allowed order lifecycle transitions and RBAC permissions.

import OrderTimeline from '../models/OrderTimeline.js';

export const TRANSITIONS = {
  ORDER_CREATED: { 
    allowedNext: ['PICKUP_REQUESTED', 'CANCELLED', 'WORKSHOP_RECEIVED'], 
    allowedRoles: ['SHOP', 'SUPER_ADMIN'] 
  },
  CREATED: { 
    allowedNext: ['PICKUP_REQUESTED', 'CANCELLED'], 
    allowedRoles: ['SHOP', 'SUPER_ADMIN'] 
  },
  
  PICKUP_REQUESTED: { 
    allowedNext: ['PICKUP_ASSIGNED', 'CANCELLED'], 
    allowedRoles: ['SUPER_ADMIN', 'MASTER'] 
  },
  
  PICKUP_ASSIGNED: { 
    allowedNext: ['PICKUP_ACCEPTED', 'PICKED_UP', 'PICKUP_ASSIGNED'], 
    allowedRoles: ['DELIVERY_BOY', 'SUPER_ADMIN'] 
  },
  
  PICKUP_ACCEPTED: { 
    allowedNext: ['PICKED_UP'], 
    allowedRoles: ['DELIVERY_BOY'] 
  },
  
  PICKED_UP: { 
    allowedNext: ['WORKSHOP_RECEIVED', 'WORKSHOP_DELIVERED'], 
    allowedRoles: ['DELIVERY_BOY', 'SUPER_ADMIN'] 
  },
  
  WORKSHOP_DELIVERED: { 
    allowedNext: ['WORKSHOP_RECEIVED'], 
    allowedRoles: ['MASTER', 'SUPER_ADMIN'] 
  },
  
  WORKSHOP_RECEIVED: { 
    allowedNext: ['INSPECTION_PENDING', 'INSPECTION_COMPLETED', 'TAILOR_ASSIGNED'], 
    allowedRoles: ['MASTER', 'SUPER_ADMIN'] 
  },
  
  INSPECTION_PENDING: { 
    allowedNext: ['INSPECTION_COMPLETED', 'TAILOR_ASSIGNED'], 
    allowedRoles: ['MASTER', 'SUPER_ADMIN'] 
  },
  
  INSPECTION_COMPLETED: { 
    allowedNext: ['TAILOR_ASSIGNED'], 
    allowedRoles: ['MASTER', 'SUPER_ADMIN'] 
  },
  
  TAILOR_ASSIGNED: { 
    allowedNext: ['TAILOR_ACCEPTED', 'WORK_STARTED', 'TAILOR_ASSIGNED'], 
    allowedRoles: ['TAILOR', 'MASTER', 'SUPER_ADMIN'] 
  },
  
  TAILOR_ACCEPTED: { 
    allowedNext: ['WORK_STARTED'], 
    allowedRoles: ['TAILOR'] 
  },
  
  WORK_STARTED: { 
    allowedNext: ['WORK_IN_PROGRESS', 'WORK_COMPLETED'], 
    allowedRoles: ['TAILOR'] 
  },
  
  WORK_IN_PROGRESS: { 
    allowedNext: ['WORK_IN_PROGRESS', 'WORK_COMPLETED'], 
    allowedRoles: ['TAILOR'] 
  },
  
  WORK_COMPLETED: { 
    allowedNext: ['QC_PENDING', 'QC_APPROVED', 'QC_FAILED', 'QUALITY_CHECK'], 
    allowedRoles: ['TAILOR', 'MASTER', 'SUPER_ADMIN'] 
  },
  
  QUALITY_CHECK: { 
    allowedNext: ['QC_APPROVED', 'QC_FAILED'], 
    allowedRoles: ['MASTER', 'SUPER_ADMIN'] 
  },
  
  QC_PENDING: { 
    allowedNext: ['QC_APPROVED', 'QC_FAILED'], 
    allowedRoles: ['MASTER', 'SUPER_ADMIN'] 
  },
  
  QC_FAILED: { 
    allowedNext: ['REWORK_REQUIRED', 'WORK_STARTED'], 
    allowedRoles: ['MASTER', 'SUPER_ADMIN'] 
  },
  
  REWORK_REQUIRED: { 
    allowedNext: ['WORK_STARTED', 'WORK_IN_PROGRESS'], 
    allowedRoles: ['TAILOR', 'MASTER', 'SUPER_ADMIN'] 
  },
  
  QC_APPROVED: { 
    allowedNext: ['READY_FOR_DELIVERY'], 
    allowedRoles: ['MASTER', 'SUPER_ADMIN'] 
  },
  
  READY_FOR_DELIVERY: { 
    allowedNext: ['DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY'], 
    allowedRoles: ['SUPER_ADMIN', 'MASTER'] 
  },
  
  DELIVERY_ASSIGNED: { 
    allowedNext: ['DELIVERY_ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERY_ASSIGNED'], 
    allowedRoles: ['DELIVERY_BOY', 'SUPER_ADMIN'] 
  },
  
  DELIVERY_ACCEPTED: { 
    allowedNext: ['OUT_FOR_DELIVERY', 'DELIVERED_TO_SHOP'], 
    allowedRoles: ['DELIVERY_BOY'] 
  },
  
  OUT_FOR_DELIVERY: { 
    allowedNext: ['DELIVERED_TO_SHOP'], 
    allowedRoles: ['DELIVERY_BOY', 'SHOP', 'SUPER_ADMIN'] 
  },
  
  DELIVERED_TO_SHOP: { 
    allowedNext: ['ORDER_CLOSED'], 
    allowedRoles: ['SHOP', 'SUPER_ADMIN'] 
  },
  
  ORDER_CLOSED: { 
    allowedNext: ['ORDER_CREATED'], // Admin reopen
    allowedRoles: ['SUPER_ADMIN'] 
  },
  
  CANCELLED: { 
    allowedNext: ['ORDER_CREATED'], // Admin reopen
    allowedRoles: ['SUPER_ADMIN'] 
  }
};

export const assertTransition = (currentStatus, nextStatus, userRole) => {
  const rules = TRANSITIONS[currentStatus];
  
  if (!rules) {
    throw new Error(`Invalid current status: ${currentStatus}`);
  }
  
  if (!rules.allowedNext.includes(nextStatus)) {
    throw new Error(`Illegal state transition from ${currentStatus} to ${nextStatus}.`);
  }
  
  if (!rules.allowedRoles.includes(userRole) && userRole !== 'SUPER_ADMIN') {
    throw new Error(`Role ${userRole} is not permitted to transition order to ${nextStatus}.`);
  }
  
  return true;
};

export const recordTimeline = async ({ orderId, fromStatus, toStatus, action, performedBy, performedByRole, note, metadata, session }) => {
  try {
    const timelineData = [{
      orderId,
      fromStatus,
      toStatus,
      action: action || `Order transitioned to ${toStatus}`,
      performedBy,
      performedByRole,
      note,
      metadata
    }];
    
    if (session) {
      await OrderTimeline.create(timelineData, { session });
    } else {
      await OrderTimeline.create(timelineData);
    }
  } catch (err) {
    console.error('Failed to record order timeline:', err.message);
  }
};
