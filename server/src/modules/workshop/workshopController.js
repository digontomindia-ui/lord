import Order from '../../models/Order.js';
import Master from '../../models/Master.js';
import Tailor from '../../models/Tailor.js';
import Inspection from '../../models/Inspection.js';
import QCRecord from '../../models/QCRecord.js';
import ReworkRecord from '../../models/ReworkRecord.js';
import WorkAssignment from '../../models/WorkAssignment.js';
import DeliveryTask from '../../models/DeliveryTask.js';
import { assertTransition, recordTimeline } from '../../services/orderStateMachine.js';
import { sendNotification } from '../../services/notificationService.js';
import { logAudit } from '../../services/auditService.js';

const resolveMasterId = async (user) => {
  if (user.role === 'SUPER_ADMIN') return null;
  const master = await Master.findOne({ userId: user._id });
  return master ? master._id : user._id;
};

// @desc    Workshop receiving queue
// @route   GET /api/v1/master/receiving
// @access  Private (MASTER, SUPER_ADMIN)
export const getReceivingQueue = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['PICKED_UP', 'WORKSHOP_DELIVERED'] }
    }).populate('shopId', 'shopName mobile address');

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Workshop accept intake
// @route   POST /api/v1/master/receiving/:orderId/accept
// @access  Private (MASTER, SUPER_ADMIN)
export const acceptReceiving = async (req, res) => {
  try {
    const { quantity, notes } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    assertTransition(order.status, 'WORKSHOP_RECEIVED', req.user.role);

    const masterId = await resolveMasterId(req.user);
    order.status = 'WORKSHOP_RECEIVED';
    if (masterId) order.masterId = masterId;
    await order.save();

    await recordTimeline({
      orderId: order._id,
      fromStatus: 'PICKED_UP',
      toStatus: 'WORKSHOP_RECEIVED',
      action: 'Workshop Intake Accepted',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      note: notes || `Verified ${quantity || order.items.length} garment items intake`
    });

    res.json({ success: true, message: 'Garments received in workshop', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit master pre-work inspection
// @route   POST /api/v1/master/inspections/:orderId
// @access  Private (MASTER, SUPER_ADMIN)
export const submitInspection = async (req, res) => {
  try {
    const { 
      garmentCondition = 'GOOD', 
      damageFound = false, 
      damageImages = [], 
      alterationVerified = true, 
      priorityVerified = true, 
      deliveryDateVerified = true, 
      specialNotesVerified = true, 
      notes 
    } = req.body;

    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const masterId = await resolveMasterId(req.user);

    const inspection = await Inspection.create({
      orderId: order._id,
      masterId: masterId || req.user._id,
      garmentCondition,
      damageFound,
      damageImages,
      alterationVerified,
      priorityVerified,
      deliveryDateVerified,
      specialNotesVerified,
      notes
    });

    order.status = 'INSPECTION_COMPLETED';
    await order.save();

    await recordTimeline({
      orderId: order._id,
      fromStatus: 'WORKSHOP_RECEIVED',
      toStatus: 'INSPECTION_COMPLETED',
      action: 'Pre-Work Inspection Completed',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      note: notes || `Condition: ${garmentCondition}, Damage: ${damageFound}`
    });

    res.status(201).json({ success: true, message: 'Inspection recorded successfully', data: inspection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tailors list under this master
// @route   GET /api/v1/master/tailors
// @access  Private (MASTER, SUPER_ADMIN)
export const getMasterTailors = async (req, res) => {
  try {
    const masterId = await resolveMasterId(req.user);
    const query = masterId ? { masterId } : {};

    const tailors = await Tailor.find(query).populate('userId', 'name mobile status');
    res.json({ success: true, data: tailors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign Tailor to order
// @route   POST /api/v1/master/orders/:orderId/assign-tailor
// @access  Private (MASTER, SUPER_ADMIN)
export const assignTailor = async (req, res) => {
  try {
    const { tailorId, instructions, estimatedMinutes } = req.body;
    if (!tailorId) return res.status(400).json({ success: false, message: 'Tailor ID is required' });

    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    assertTransition(order.status, 'TAILOR_ASSIGNED', req.user.role);

    const masterId = await resolveMasterId(req.user);

    order.tailorId = tailorId;
    order.status = 'TAILOR_ASSIGNED';
    await order.save();

    const assignment = await WorkAssignment.create({
      orderId: order._id,
      masterId: masterId || req.user._id,
      tailorId,
      instructions,
      estimatedMinutes,
      status: 'ASSIGNED'
    });

    await recordTimeline({
      orderId: order._id,
      fromStatus: order.status,
      toStatus: 'TAILOR_ASSIGNED',
      action: 'Tailor Assigned',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      note: instructions || 'Tailor assigned to alteration task'
    });

    // Notify tailor
    await sendNotification({
      recipientId: tailorId,
      type: 'TAILOR_ASSIGNED',
      title: 'New Alteration Task Assigned',
      message: `You have been assigned order ${order.orderNumber}.`,
      data: { orderId: order._id }
    });

    res.json({ success: true, message: 'Tailor assigned successfully', data: { order, assignment } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get QC Queue
// @route   GET /api/v1/master/qc
// @access  Private (MASTER, SUPER_ADMIN)
export const getQCQueue = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['WORK_COMPLETED', 'QC_PENDING'] }
    }).populate('tailorId', 'name tailorCode mobile');

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve Quality Control
// @route   POST /api/v1/master/qc/:orderId/approve
// @access  Private (MASTER, SUPER_ADMIN)
export const approveQC = async (req, res) => {
  try {
    const { measurementCheck, fittingCheck, finishingCheck, qualityCheck, images } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    assertTransition(order.status, 'QC_APPROVED', req.user.role);

    const masterId = await resolveMasterId(req.user);
    const prevAttempts = await QCRecord.countDocuments({ orderId: order._id });

    const qc = await QCRecord.create({
      orderId: order._id,
      masterId: masterId || req.user._id,
      attemptNumber: prevAttempts + 1,
      measurementCheck: measurementCheck || { passed: true },
      fittingCheck: fittingCheck || { passed: true },
      finishingCheck: finishingCheck || { passed: true },
      qualityCheck: qualityCheck || { passed: true },
      overallStatus: 'PASSED',
      images: images || []
    });

    order.status = 'READY_FOR_DELIVERY';
    await order.save();

    // Spawn Delivery Task to return to shop
    await DeliveryTask.create({
      orderId: order._id,
      type: 'RETURN_DELIVERY',
      from: { type: 'WORKSHOP', id: masterId || req.user._id, address: 'Workshop Location' },
      to: { type: 'SHOP', id: order.shopId, address: 'Shop Location' },
      status: 'ASSIGNED'
    });

    await recordTimeline({
      orderId: order._id,
      fromStatus: 'QC_PENDING',
      toStatus: 'QC_APPROVED',
      action: 'Quality Check Approved',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      note: 'All measurement and finishing parameters passed inspection'
    });

    res.json({ success: true, message: 'QC passed and order is ready for delivery', data: { order, qc } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Fail QC and trigger Rework
// @route   POST /api/v1/master/qc/:orderId/fail
// @access  Private (MASTER, SUPER_ADMIN)
export const failQC = async (req, res) => {
  try {
    const { reason, instructions, measurementCheck, fittingCheck, finishingCheck, qualityCheck, images } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Failure reason is required' });

    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    assertTransition(order.status, 'QC_FAILED', req.user.role);

    const masterId = await resolveMasterId(req.user);
    const prevAttempts = await QCRecord.countDocuments({ orderId: order._id });

    const qc = await QCRecord.create({
      orderId: order._id,
      masterId: masterId || req.user._id,
      attemptNumber: prevAttempts + 1,
      measurementCheck: measurementCheck || { passed: false, note: reason },
      fittingCheck: fittingCheck || { passed: false },
      finishingCheck: finishingCheck || { passed: false },
      qualityCheck: qualityCheck || { passed: false },
      overallStatus: 'FAILED',
      failureReason: reason,
      images: images || []
    });

    const rework = await ReworkRecord.create({
      orderId: order._id,
      qcId: qc._id,
      tailorId: order.tailorId,
      masterId: masterId || req.user._id,
      reason,
      instructions: instructions || reason,
      status: 'PENDING'
    });

    order.status = 'REWORK_REQUIRED';
    await order.save();

    await recordTimeline({
      orderId: order._id,
      fromStatus: 'QC_PENDING',
      toStatus: 'REWORK_REQUIRED',
      action: 'QC Failed - Rework Required',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      note: `Reason: ${reason}. Instructions: ${instructions || 'See QC notes'}`
    });

    // Notify tailor of rework
    if (order.tailorId) {
      await sendNotification({
        recipientId: order.tailorId,
        type: 'REWORK_REQUIRED',
        title: 'Rework Required on Order',
        message: `Order ${order.orderNumber} failed QC: ${reason}`,
        data: { orderId: order._id, reworkId: rework._id }
      });
    }

    res.json({ success: true, message: 'QC failed, rework ticket issued', data: { order, qc, rework } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
