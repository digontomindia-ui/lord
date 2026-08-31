import Order from '../../models/Order.js';
import User from '../../models/User.js';
import Shop from '../../models/Shop.js';
import Master from '../../models/Master.js';
import Tailor from '../../models/Tailor.js';
import DeliveryBoy from '../../models/DeliveryBoy.js';
import PickupTask from '../../models/PickupTask.js';
import DeliveryTask from '../../models/DeliveryTask.js';
import Wallet from '../../models/Wallet.js';

const getStartOfToday = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

// @desc    Super Admin aggregated dashboard
// @route   GET /api/v1/admin/dashboard
// @access  Private (SUPER_ADMIN)
export const getAdminDashboard = async (req, res) => {
  try {
    const today = getStartOfToday();

    const [
      shopsCount,
      mastersCount,
      tailorsCount,
      deliveryBoysCount,
      ordersToday,
      ordersPending,
      ordersCompleted,
      allOrders
    ] = await Promise.all([
      User.countDocuments({ role: 'SHOP' }),
      User.countDocuments({ role: 'MASTER' }),
      User.countDocuments({ role: 'TAILOR' }),
      User.countDocuments({ role: 'DELIVERY_BOY' }),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: { $nin: ['ORDER_CLOSED', 'CANCELLED'] } }),
      Order.countDocuments({ status: 'ORDER_CLOSED' }),
      Order.find({ status: { $ne: 'CANCELLED' } }).select('pricing.total createdAt')
    ]);

    const todayRevenue = allOrders
      .filter(o => o.createdAt >= today)
      .reduce((sum, o) => sum + (o.pricing?.total || 0), 0);

    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);

    res.json({
      success: true,
      data: {
        users: {
          shops: shopsCount,
          masters: mastersCount,
          tailors: tailorsCount,
          deliveryBoys: deliveryBoysCount
        },
        orders: {
          today: ordersToday,
          pending: ordersPending,
          completed: ordersCompleted,
          total: allOrders.length
        },
        revenue: {
          today: todayRevenue,
          monthly: totalRevenue,
          total: totalRevenue
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Shop aggregated dashboard
// @route   GET /api/v1/shop/dashboard
// @access  Private (SHOP, SUPER_ADMIN)
export const getShopDashboard = async (req, res) => {
  try {
    const today = getStartOfToday();
    const shop = await Shop.findOne({ userId: req.user._id });
    const shopId = shop ? shop._id : req.user._id;

    const [
      ordersToday,
      ordersPending,
      ordersInProgress,
      ordersReady,
      ordersCompleted,
      allShopOrders,
      pendingPickups,
      pendingDeliveries,
      wallet
    ] = await Promise.all([
      Order.countDocuments({ shopId, createdAt: { $gte: today } }),
      Order.countDocuments({ shopId, status: { $in: ['ORDER_CREATED', 'PICKUP_REQUESTED'] } }),
      Order.countDocuments({ shopId, status: { $in: ['WORKSHOP_RECEIVED', 'TAILOR_ASSIGNED', 'WORK_STARTED', 'WORK_IN_PROGRESS', 'QC_PENDING'] } }),
      Order.countDocuments({ shopId, status: { $in: ['READY_FOR_DELIVERY', 'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED_TO_SHOP'] } }),
      Order.countDocuments({ shopId, status: 'ORDER_CLOSED' }),
      Order.find({ shopId, status: { $ne: 'CANCELLED' } }).select('pricing.total createdAt'),
      PickupTask.countDocuments({ shopId, status: { $in: ['REQUESTED', 'ASSIGNED'] } }),
      DeliveryTask.countDocuments({ 'to.id': shopId, status: { $ne: 'COMPLETED' } }),
      Wallet.findOne({ userId: req.user._id })
    ]);

    const todayRevenue = allShopOrders
      .filter(o => o.createdAt >= today)
      .reduce((sum, o) => sum + (o.pricing?.total || 0), 0);

    const totalRevenue = allShopOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);

    res.json({
      success: true,
      data: {
        todayOrders: ordersToday,
        pending: ordersPending,
        inProgress: ordersInProgress,
        ready: ordersReady,
        completed: ordersCompleted,
        todayRevenue,
        monthlyRevenue: totalRevenue,
        pendingPickups,
        pendingDeliveries,
        walletBalance: wallet?.balances?.main || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Master Workshop aggregated dashboard
// @route   GET /api/v1/master/dashboard
// @access  Private (MASTER, SUPER_ADMIN)
export const getMasterDashboard = async (req, res) => {
  try {
    const master = await Master.findOne({ userId: req.user._id });
    const masterId = master ? master._id : req.user._id;

    const [
      received,
      inspectionPending,
      assigned,
      inProgress,
      qcPending,
      qcFailed,
      readyForDelivery
    ] = await Promise.all([
      Order.countDocuments({ status: 'WORKSHOP_RECEIVED' }),
      Order.countDocuments({ status: 'INSPECTION_PENDING' }),
      Order.countDocuments({ status: 'TAILOR_ASSIGNED' }),
      Order.countDocuments({ status: { $in: ['WORK_STARTED', 'WORK_IN_PROGRESS'] } }),
      Order.countDocuments({ status: 'QC_PENDING' }),
      Order.countDocuments({ status: { $in: ['QC_FAILED', 'REWORK_REQUIRED'] } }),
      Order.countDocuments({ status: 'READY_FOR_DELIVERY' })
    ]);

    res.json({
      success: true,
      data: {
        received,
        inspectionPending,
        assigned,
        inProgress,
        qcPending,
        qcFailed,
        readyForDelivery
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Tailor aggregated dashboard
// @route   GET /api/v1/tailor/dashboard
// @access  Private (TAILOR, SUPER_ADMIN)
export const getTailorDashboard = async (req, res) => {
  try {
    const today = getStartOfToday();

    const [
      assigned,
      accepted,
      inProgress,
      completedToday,
      rework,
      wallet
    ] = await Promise.all([
      Order.countDocuments({ tailorId: req.user._id, status: 'TAILOR_ASSIGNED' }),
      Order.countDocuments({ tailorId: req.user._id, status: 'TAILOR_ACCEPTED' }),
      Order.countDocuments({ tailorId: req.user._id, status: { $in: ['WORK_STARTED', 'WORK_IN_PROGRESS'] } }),
      Order.countDocuments({ tailorId: req.user._id, status: { $in: ['WORK_COMPLETED', 'QC_PENDING', 'QC_APPROVED', 'ORDER_CLOSED'] }, updatedAt: { $gte: today } }),
      Order.countDocuments({ tailorId: req.user._id, status: 'REWORK_REQUIRED' }),
      Wallet.findOne({ userId: req.user._id })
    ]);

    res.json({
      success: true,
      data: {
        assigned,
        accepted,
        todayWork: inProgress,
        completedToday,
        rework,
        earningsToday: wallet?.balances?.todaysWork || 0,
        qualityScore: 98
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delivery Boy aggregated dashboard
// @route   GET /api/v1/delivery/dashboard
// @access  Private (DELIVERY_BOY, SUPER_ADMIN)
export const getDeliveryDashboard = async (req, res) => {
  try {
    const today = getStartOfToday();

    const [
      pickupsPending,
      deliveriesPending,
      completedToday,
      wallet
    ] = await Promise.all([
      PickupTask.countDocuments({ deliveryBoyId: req.user._id, status: { $in: ['ASSIGNED', 'ACCEPTED', 'ARRIVED'] } }),
      DeliveryTask.countDocuments({ deliveryBoyId: req.user._id, status: { $in: ['ASSIGNED', 'ACCEPTED', 'ARRIVED', 'COLLECTED', 'OUT_FOR_DELIVERY'] } }),
      DeliveryTask.countDocuments({ deliveryBoyId: req.user._id, status: 'COMPLETED', completedAt: { $gte: today } }),
      Wallet.findOne({ userId: req.user._id })
    ]);

    res.json({
      success: true,
      data: {
        todayPickup: pickupsPending,
        todayDelivery: deliveriesPending,
        completedToday,
        earningsToday: wallet?.balances?.todaysWork || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
