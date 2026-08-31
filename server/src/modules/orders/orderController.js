import Order from '../../models/Order.js';
import OrderTimeline from '../../models/OrderTimeline.js';
import Customer from '../../models/Customer.js';
import PickupTask from '../../models/PickupTask.js';
import Shop from '../../models/Shop.js';
import { assertTransition, recordTimeline } from '../../services/orderStateMachine.js';
import { getNextSequence } from '../../services/counterService.js';
import { processReferralCommission } from '../../services/referralService.js';
import { logAudit } from '../../services/auditService.js';
import { sendNotification } from '../../services/notificationService.js';

const resolveShopId = async (user) => {
  if (user.role === 'SUPER_ADMIN') return null;
  const shop = await Shop.findOne({ userId: user._id });
  return shop ? shop._id : user._id;
};

// @desc    Create new order (Multi-item, alterations & measurements)
// @route   POST /api/v1/shop/orders or /api/orders
// @access  Private (SHOP, SUPER_ADMIN)
export const createOrder = async (req, res) => {
  try {
    const { 
      customerId, 
      items, 
      garmentType, // backward compatibility single item
      alterationDetails, // backward compatibility
      priority = 'NORMAL', 
      deliveryDate, 
      specialNotes,
      pricing
    } = req.body;

    const effectiveShopId = req.user.role === 'SUPER_ADMIN' && req.body.shopId 
      ? req.body.shopId 
      : await resolveShopId(req.user);

    // Format items array
    let orderItems = [];
    if (items && Array.isArray(items) && items.length > 0) {
      orderItems = items.map(item => ({
        garmentType: item.garmentType,
        quantity: item.quantity || 1,
        alterations: item.alterations || {},
        measurements: item.measurements || {},
        damageNotes: item.damageNotes,
        damageImages: item.damageImages || [],
        specialNotes: item.specialNotes,
        itemPrice: item.itemPrice || 0
      }));
    } else if (garmentType) {
      orderItems = [{
        garmentType,
        quantity: 1,
        alterations: alterationDetails || {},
        itemPrice: pricing?.total || 0
      }];
    } else {
      return res.status(400).json({ success: false, message: 'At least one garment item is required' });
    }

    // Atomic sequential order number: ORD-2026-000001
    const orderNumber = await getNextSequence('orders', 'ORD');

    // Calculate subtotal if not provided
    const calculatedTotal = orderItems.reduce((acc, curr) => acc + (curr.itemPrice * curr.quantity), 0);
    const orderPricing = {
      subtotal: pricing?.subtotal || calculatedTotal,
      discount: pricing?.discount || 0,
      tax: pricing?.tax || 0,
      total: pricing?.total || calculatedTotal
    };

    const order = await Order.create({
      orderNumber,
      shopId: effectiveShopId,
      customerId,
      items: orderItems,
      priority,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'ORDER_CREATED',
      pricing: orderPricing,
      specialNotes
    });

    // Increment customer statistics
    if (customerId) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { 'statistics.totalOrders': 1, 'statistics.totalBusiness': orderPricing.total },
        $set: { lastOrderAt: new Date() }
      });
    }

    // Record initial timeline
    await recordTimeline({
      orderId: order._id,
      fromStatus: null,
      toStatus: 'ORDER_CREATED',
      action: 'Order Placed',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      note: specialNotes || 'Initial order creation'
    });

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: 'ORDER_CREATE',
      module: 'ORDERS',
      entityType: 'Order',
      entityId: order._id,
      newData: { orderNumber, total: orderPricing.total },
      req
    });

    res.status(201).json({ 
      success: true, 
      message: 'Order created successfully', 
      data: order 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating order', error: error.message });
  }
};

// @desc    Get orders (Scoped by role & query filters)
// @route   GET /api/v1/orders or /api/orders
// @access  Private
export const getOrders = async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      search, 
      from, 
      to, 
      page = 1, 
      limit = 20, 
      customerId,
      shopId,
      masterId,
      tailorId,
      deliveryBoyId
    } = req.query;

    const query = { ...(req.tenantFilter || {}) };

    if (req.user.role === 'SHOP') {
      const sId = await resolveShopId(req.user);
      query.shopId = sId;
    } else if (req.user.role === 'TAILOR') {
      query.tailorId = req.user._id;
    } else if (req.user.role === 'DELIVERY_BOY') {
      query.$or = [{ pickupDeliveryBoyId: req.user._id }, { returnDeliveryBoyId: req.user._id }];
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (customerId) query.customerId = customerId;
    if (shopId && req.user.role === 'SUPER_ADMIN') query.shopId = shopId;
    if (masterId) query.masterId = masterId;
    if (tailorId) query.tailorId = tailorId;
    if (deliveryBoyId) query.$or = [{ pickupDeliveryBoyId: deliveryBoyId }, { returnDeliveryBoyId: deliveryBoyId }];

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { specialNotes: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customerId', 'name mobile customerCode')
        .populate('shopId', 'shopName shopCode')
        .populate('tailorId', 'name tailorCode')
        .populate('masterId', 'workshopName masterCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: orders.length,
      data: orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching orders', error: error.message });
  }
};

// @desc    Get order details by ID
// @route   GET /api/v1/orders/:id or /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name mobile email address customerCode')
      .populate('shopId', 'shopName shopCode ownerName mobile address')
      .populate('masterId', 'workshopName masterCode mobile address')
      .populate('tailorId', 'name tailorCode mobile specialization')
      .populate('pickupDeliveryBoyId', 'name mobile vehicle')
      .populate('returnDeliveryBoyId', 'name mobile vehicle');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Tenant check
    if (req.user.role === 'SHOP') {
      const sId = await resolveShopId(req.user);
      if (String(order.shopId?._id || order.shopId) !== String(sId)) {
        return res.status(403).json({ success: false, message: 'Access denied to this shop order' });
      }
    } else if (req.user.role === 'TAILOR' && String(order.tailorId?._id || order.tailorId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied: not assigned to this tailor' });
    }

    const timelines = await OrderTimeline.find({ orderId: order._id })
      .populate('performedBy', 'name role')
      .sort({ createdAt: 1 });

    res.json({ 
      success: true, 
      data: { ...order.toObject(), timeline: timelines } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching order details', error: error.message });
  }
};

// @desc    Get order timeline history
// @route   GET /api/v1/orders/:id/timeline
// @access  Private
export const getOrderTimeline = async (req, res) => {
  try {
    const timelines = await OrderTimeline.find({ orderId: req.params.id })
      .populate('performedBy', 'name role')
      .sort({ createdAt: 1 });
    res.json({ success: true, data: timelines });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching order timeline', error: error.message });
  }
};

// @desc    Request pickup for order
// @route   POST /api/v1/orders/:id/pickup-request or /api/v1/shop/orders/:id/pickup-request
// @access  Private (SHOP, SUPER_ADMIN)
export const requestPickup = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    assertTransition(order.status, 'PICKUP_REQUESTED', req.user.role);

    order.status = 'PICKUP_REQUESTED';
    await order.save();

    // Spawn pickup task
    const totalQuantity = order.items.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
    const shop = await Shop.findById(order.shopId);

    const pickupTask = await PickupTask.create({
      orderId: order._id,
      shopId: order.shopId,
      quantity: totalQuantity,
      pickupLocation: {
        address: shop?.address ? `${shop.address.line1}, ${shop.address.city}` : 'Shop Location'
      },
      status: 'REQUESTED'
    });

    await recordTimeline({
      orderId: order._id,
      fromStatus: 'ORDER_CREATED',
      toStatus: 'PICKUP_REQUESTED',
      action: 'Pickup Requested',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      note: `Requested pickup for ${totalQuantity} garment items`
    });

    res.json({ success: true, message: 'Pickup requested successfully', data: { order, pickupTask } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel order
// @route   POST /api/v1/orders/:id/cancel or /api/v1/shop/orders/:id/cancel
// @access  Private (SHOP, SUPER_ADMIN)
export const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    assertTransition(order.status, 'CANCELLED', req.user.role);

    const prevStatus = order.status;
    order.status = 'CANCELLED';
    order.cancellation = {
      reason: reason || 'Cancelled by user',
      cancelledBy: req.user._id,
      cancelledAt: new Date()
    };
    await order.save();

    await recordTimeline({
      orderId: order._id,
      fromStatus: prevStatus,
      toStatus: 'CANCELLED',
      action: 'Order Cancelled',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      note: reason
    });

    res.json({ success: true, message: 'Order cancelled successfully', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Transition Order Status (State Machine Guard)
// @route   PATCH /api/v1/orders/:id/transition or PATCH /api/orders/:id/transition
// @access  Private
export const transitionOrder = async (req, res) => {
  try {
    const { nextStatus, note, tailorId, masterId, deliveryBoyId, metadata } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    assertTransition(order.status, nextStatus, req.user.role);

    const prevStatus = order.status;
    order.status = nextStatus;

    if (tailorId) order.tailorId = tailorId;
    if (masterId) order.masterId = masterId;
    if (deliveryBoyId) {
      if (['PICKUP_ASSIGNED', 'PICKUP_ACCEPTED', 'PICKED_UP'].includes(nextStatus)) {
        order.pickupDeliveryBoyId = deliveryBoyId;
      } else {
        order.returnDeliveryBoyId = deliveryBoyId;
      }
    }

    await order.save();

    await recordTimeline({
      orderId: order._id,
      fromStatus: prevStatus,
      toStatus: nextStatus,
      action: `Transitioned to ${nextStatus}`,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      note,
      metadata
    });

    // If order closed -> trigger 10-level referral commission distribution
    if (nextStatus === 'ORDER_CLOSED') {
      await processReferralCommission(order._id, order.shopId, order.pricing.total);
    }

    res.json({ success: true, message: `Order transitioned to ${nextStatus}`, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
