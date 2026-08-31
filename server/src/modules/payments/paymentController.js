import Payment from '../../models/Payment.js';
import Order from '../../models/Order.js';
import Invoice from '../../models/Invoice.js';
import Shop from '../../models/Shop.js';

const resolveShopId = async (user) => {
  if (user.role === 'SUPER_ADMIN') return null;
  const shop = await Shop.findOne({ userId: user._id });
  return shop ? shop._id : user._id;
};

// @desc    Record a customer payment for an order
// @route   POST /api/v1/payments or /api/payments
// @access  Private (SHOP, SUPER_ADMIN)
export const recordPayment = async (req, res) => {
  try {
    const { orderId, amount, method, transactionReference } = req.body;
    if (!orderId || !amount || !method) {
      return res.status(400).json({ success: false, message: 'Order ID, amount, and payment method are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const effectiveShopId = await resolveShopId(req.user);

    const payment = await Payment.create({
      orderId: order._id,
      shopId: order.shopId || effectiveShopId,
      amount: Number(amount),
      method,
      transactionReference,
      status: 'SUCCESS'
    });

    const newPaidAmount = (order.payment?.paidAmount || 0) + Number(amount);
    order.payment.paidAmount = newPaidAmount;
    if (newPaidAmount >= order.pricing.total) {
      order.payment.status = 'PAID';
    } else {
      order.payment.status = 'PARTIAL';
    }
    await order.save();

    // Sync Invoice if present
    await Invoice.findOneAndUpdate(
      { orderId: order._id },
      { paymentStatus: order.payment.status }
    );

    res.status(201).json({ success: true, message: 'Payment recorded successfully', data: { payment, order } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get payment history
// @route   GET /api/v1/payments or /api/payments
// @access  Private
export const getPayments = async (req, res) => {
  try {
    const effectiveShopId = await resolveShopId(req.user);
    const query = effectiveShopId ? { shopId: effectiveShopId } : {};

    const payments = await Payment.find(query)
      .populate('orderId', 'orderNumber pricing.total')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
