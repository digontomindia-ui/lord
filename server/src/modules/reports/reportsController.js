import Order from '../../models/Order.js';
import User from '../../models/User.js';

// @desc    Get order statistics
// @route   GET /api/v1/reports/orders or /api/reports/orders
// @access  Private
export const getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $match: req.tenantFilter || {} },
      { $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$pricing.total' }
      }}
    ]);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching report', error: error.message });
  }
};

// @desc    Get Revenue report (Admin / Shop)
// @route   GET /api/v1/reports/revenue or /api/reports/revenue
// @access  Private
export const getRevenueReport = async (req, res) => {
  try {
    const query = { status: 'ORDER_CLOSED', ...(req.tenantFilter || {}) };
    const revenue = await Order.aggregate([
      { $match: query },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          dailyRevenue: { $sum: '$pricing.total' },
          ordersCompleted: { $sum: 1 }
      }},
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);
    res.json({ success: true, count: revenue.length, data: revenue });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching revenue report', error: error.message });
  }
};

// @desc    Get performance breakdown by shop
// @route   GET /api/v1/admin/reports/shop
// @access  Private (SUPER_ADMIN)
export const getShopReport = async (req, res) => {
  try {
    const report = await Order.aggregate([
      { $group: {
          _id: '$shopId',
          totalOrders: { $sum: 1 },
          completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'ORDER_CLOSED'] }, 1, 0] } },
          totalRevenue: { $sum: '$pricing.total' }
      }},
      { $lookup: {
          from: 'shops',
          localField: '_id',
          foreignField: '_id',
          as: 'shop'
      }},
      { $unwind: { path: '$shop', preserveNullAndEmptyArrays: true } },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
