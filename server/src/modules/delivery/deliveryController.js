import DeliveryTask from '../../models/DeliveryTask.js';
import PickupTask from '../../models/PickupTask.js';
import Order from '../../models/Order.js';
import { assertTransition, recordTimeline } from '../../services/orderStateMachine.js';
import { creditWallet } from '../../services/walletService.js';
import { processReferralCommission } from '../../services/referralService.js';

// @desc    Get active delivery tasks for delivery boy
// @route   GET /api/v1/delivery/tasks or /api/delivery/tasks
// @access  Private (DELIVERY_BOY, SUPER_ADMIN)
export const getDeliveryTasks = async (req, res) => {
  try {
    const query = req.user.role === 'SUPER_ADMIN' ? {} : { deliveryBoyId: req.user._id };
    const [pickups, deliveries] = await Promise.all([
      PickupTask.find(query).populate('orderId').populate('shopId', 'shopName mobile address'),
      DeliveryTask.find(query).populate('orderId')
    ]);

    res.json({
      success: true,
      data: {
        pickups,
        deliveries
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept delivery task
// @route   POST /api/v1/delivery/tasks/:id/accept
// @access  Private (DELIVERY_BOY)
export const acceptTask = async (req, res) => {
  try {
    const task = await DeliveryTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Delivery task not found' });

    task.status = 'ACCEPTED';
    task.acceptedAt = new Date();
    task.deliveryBoyId = req.user._id;
    await task.save();

    res.json({ success: true, message: 'Delivery task accepted', data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark arrived at pickup/delivery point
// @route   POST /api/v1/delivery/tasks/:id/arrived
// @access  Private (DELIVERY_BOY)
export const markArrived = async (req, res) => {
  try {
    const task = await DeliveryTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Delivery task not found' });

    task.status = 'ARRIVED';
    await task.save();

    res.json({ success: true, message: 'Arrived at location', data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Collect garment (Pickup from shop or Workshop return)
// @route   POST /api/v1/delivery/tasks/:id/collect
// @access  Private (DELIVERY_BOY)
export const collectGarments = async (req, res) => {
  try {
    const task = await DeliveryTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.status = 'COLLECTED';
    await task.save();

    const order = await Order.findById(task.orderId);
    if (order) {
      if (task.type === 'PICKUP') {
        order.status = 'PICKED_UP';
        order.pickupDeliveryBoyId = req.user._id;
      } else {
        order.status = 'OUT_FOR_DELIVERY';
        order.returnDeliveryBoyId = req.user._id;
      }
      await order.save();

      await recordTimeline({
        orderId: order._id,
        fromStatus: order.status,
        toStatus: order.status,
        action: `Garments Collected by Logistics`,
        performedBy: req.user._id,
        performedByRole: req.user.role
      });
    }

    res.json({ success: true, message: 'Garments collected', data: { task, order } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete delivery to shop (Handover with proof/OTP)
// @route   POST /api/v1/delivery/tasks/:id/complete
// @access  Private (DELIVERY_BOY, SUPER_ADMIN)
export const completeDelivery = async (req, res) => {
  try {
    const { image, signature, otp } = req.body;
    const task = await DeliveryTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.status = 'COMPLETED';
    task.completedAt = new Date();
    task.proof = { image, signature, otp };
    await task.save();

    const order = await Order.findById(task.orderId);
    if (order) {
      assertTransition(order.status, 'DELIVERED_TO_SHOP', req.user.role);
      order.status = 'DELIVERED_TO_SHOP';
      await order.save();

      await recordTimeline({
        orderId: order._id,
        fromStatus: 'OUT_FOR_DELIVERY',
        toStatus: 'DELIVERED_TO_SHOP',
        action: 'Garments Delivered to Shop',
        performedBy: req.user._id,
        performedByRole: req.user.role,
        note: 'Delivered and verified by shop'
      });

      // Credit delivery boy fee
      await creditWallet({
        userId: req.user._id,
        walletType: 'TODAYS_WORK',
        amount: 80,
        referenceType: 'DELIVERY_PAYOUT',
        referenceId: order._id,
        description: `Delivery payout for order ${order.orderNumber}`
      });
    }

    res.json({ success: true, message: 'Delivery completed successfully', data: { task, order } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
