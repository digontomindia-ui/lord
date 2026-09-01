import Order from '../../models/Order.js';
import Tailor from '../../models/Tailor.js';
import WorkAssignment from '../../models/WorkAssignment.js';
import WorkProgress from '../../models/WorkProgress.js';
import ReworkRecord from '../../models/ReworkRecord.js';
import { assertTransition, recordTimeline } from '../../services/orderStateMachine.js';
import { creditWallet } from '../../services/walletService.js';
import { sendNotification } from '../../services/notificationService.js';

// @desc    Get tailor assigned orders (Masks customer PII)
// @route   GET /api/v1/tailor/orders
// @access  Private (TAILOR, SUPER_ADMIN)
export const getTailorOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      tailorId: req.user._id,
      status: { $in: ['TAILOR_ASSIGNED', 'TAILOR_ACCEPTED', 'WORK_STARTED', 'WORK_IN_PROGRESS', 'REWORK_REQUIRED'] }
    })
    .select('-customerId -pricing.subtotal -pricing.discount -pricing.tax') // Strictly mask customer & financial PII
    .populate('masterId', 'workshopName masterCode')
    .sort({ priority: -1, createdAt: 1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tailor performance analytics
// @route   GET /api/v1/tailor/performance
// @access  Private (TAILOR, SUPER_ADMIN)
export const getTailorPerformance = async (req, res) => {
  try {
    const tailor = await Tailor.findOne({ userId: req.user._id });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [completedTodayCount, pendingCount] = await Promise.all([
      Order.countDocuments({
        tailorId: req.user._id,
        status: { $in: ['WORK_COMPLETED', 'QC_PENDING', 'QC_APPROVED', 'READY_FOR_DELIVERY', 'ORDER_CLOSED'] },
        updatedAt: { $gte: today }
      }),
      Order.countDocuments({
        tailorId: req.user._id,
        status: { $in: ['TAILOR_ASSIGNED', 'TAILOR_ACCEPTED', 'WORK_STARTED', 'WORK_IN_PROGRESS', 'REWORK_REQUIRED'] }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalAssigned: tailor?.performance?.totalAssigned || 0,
        completed: tailor?.performance?.completed || 0,
        pending: pendingCount,
        completedToday: completedTodayCount,
        averageTimeMinutes: tailor?.performance?.averageTimeMinutes || 45,
        qualityScore: tailor?.performance?.qualityScore || 100,
        specialization: tailor?.specialization || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept order by tailor
// @route   POST /api/v1/tailor/orders/:id/accept
// @access  Private (TAILOR)
export const acceptOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, tailorId: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Assigned order not found' });

    assertTransition(order.status, 'TAILOR_ACCEPTED', req.user.role);

    order.status = 'TAILOR_ACCEPTED';
    await order.save();

    await WorkAssignment.findOneAndUpdate(
      { orderId: order._id, tailorId: req.user._id },
      { acceptedAt: new Date(), status: 'ACCEPTED' }
    );

    await recordTimeline({
      orderId: order._id,
      fromStatus: 'TAILOR_ASSIGNED',
      toStatus: 'TAILOR_ACCEPTED',
      action: 'Tailor Acknowledged Assignment',
      performedBy: req.user._id,
      performedByRole: req.user.role
    });

    res.json({ success: true, message: 'Order accepted', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Start alteration work
// @route   POST /api/v1/tailor/orders/:id/start
// @access  Private (TAILOR)
export const startWork = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, tailorId: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Assigned order not found' });

    assertTransition(order.status, 'WORK_STARTED', req.user.role);

    order.status = 'WORK_STARTED';
    await order.save();

    await WorkAssignment.findOneAndUpdate(
      { orderId: order._id, tailorId: req.user._id },
      { startedAt: new Date(), status: 'WORKING' }
    );

    await recordTimeline({
      orderId: order._id,
      fromStatus: 'TAILOR_ACCEPTED',
      toStatus: 'WORK_STARTED',
      action: 'Alteration Work Started',
      performedBy: req.user._id,
      performedByRole: req.user.role
    });

    res.json({ success: true, message: 'Work started', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update progress sequentially (25%, 50%, 75%, 90%, 100%)
// @route   POST /api/v1/tailor/orders/:id/progress
// @access  Private (TAILOR)
export const updateProgress = async (req, res) => {
  try {
    const { progress, note, images } = req.body;
    const progressNum = Number(progress);
    
    if (![25, 50, 75, 90, 100].includes(progressNum)) {
      return res.status(400).json({ success: false, message: 'Progress must be 25, 50, 75, 90, or 100' });
    }

    const order = await Order.findOne({ _id: req.params.id, tailorId: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Assigned order not found' });

    await WorkProgress.create({
      orderId: order._id,
      tailorId: req.user._id,
      progress: progressNum,
      note,
      images: images || []
    });

    if (progressNum === 100) {
      order.status = 'WORK_COMPLETED';
    } else {
      order.status = 'WORK_IN_PROGRESS';
    }
    await order.save();

    await recordTimeline({
      orderId: order._id,
      fromStatus: order.status,
      toStatus: order.status,
      action: `Progress Updated to ${progressNum}%`,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      note: note || `Work completed up to ${progressNum}%`
    });

    res.json({ success: true, message: `Progress updated to ${progressNum}%`, data: { order, progress: progressNum } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete work and submit to Master QC
// @route   POST /api/v1/tailor/orders/:id/complete
// @access  Private (TAILOR)
export const completeWork = async (req, res) => {
  try {
    const { notes, images } = req.body;
    const order = await Order.findOne({ _id: req.params.id, tailorId: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Assigned order not found' });

    assertTransition(order.status, 'WORK_COMPLETED', req.user.role);

    order.status = 'QC_PENDING';
    await order.save();

    await WorkAssignment.findOneAndUpdate(
      { orderId: order._id, tailorId: req.user._id },
      { completedAt: new Date(), status: 'COMPLETED' }
    );

    // Accrue earnings in Today's Work bucket
    const tailorWage = order.pricing?.total ? Math.round(order.pricing.total * 0.35) : 100;
    await creditWallet({
      userId: req.user._id,
      walletType: 'TODAYS_WORK',
      amount: tailorWage,
      referenceType: 'TAILOR_LABOR',
      referenceId: order._id,
      description: `Alteration labor earned for ${order.orderNumber}`
    });

    await recordTimeline({
      orderId: order._id,
      fromStatus: 'WORK_COMPLETED',
      toStatus: 'QC_PENDING',
      action: 'Alteration Completed - Submitted for QC',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      note: notes || 'Ready for Master inspection'
    });

    // Notify Master
    if (order.masterId) {
      await sendNotification({
        recipientId: order.masterId,
        type: 'QC_PENDING',
        title: 'Garment Ready for QC',
        message: `Order ${order.orderNumber} alteration completed by tailor.`,
        data: { orderId: order._id }
      });
    }

    res.json({ success: true, message: 'Work completed and submitted for QC', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
