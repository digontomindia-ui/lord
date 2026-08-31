import Invoice from '../../models/Invoice.js';
import Order from '../../models/Order.js';
import Shop from '../../models/Shop.js';
import { getNextSequence } from '../../services/counterService.js';

const resolveShopId = async (user) => {
  if (user.role === 'SUPER_ADMIN') return null;
  const shop = await Shop.findOne({ userId: user._id });
  return shop ? shop._id : user._id;
};

// @desc    Get shop invoices
// @route   GET /api/v1/shop/invoices or /api/invoices
// @access  Private (SHOP, SUPER_ADMIN)
export const getInvoices = async (req, res) => {
  try {
    const effectiveShopId = await resolveShopId(req.user);
    const query = effectiveShopId ? { shopId: effectiveShopId } : {};

    const invoices = await Invoice.find(query)
      .populate('customerId', 'name mobile')
      .populate('orderId', 'orderNumber status')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get invoice by ID
// @route   GET /api/v1/shop/invoices/:id or /api/invoices/:id
// @access  Private
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId')
      .populate('shopId')
      .populate('orderId');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate invoice for an order
// @route   POST /api/v1/shop/invoices/generate
// @access  Private (SHOP, SUPER_ADMIN)
export const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Check if invoice already exists
    const existing = await Invoice.findOne({ orderId });
    if (existing) {
      return res.json({ success: true, message: 'Invoice already exists', data: existing });
    }

    const invoiceNumber = await getNextSequence('invoices', 'INV');
    const invoice = await Invoice.create({
      invoiceNumber,
      orderId: order._id,
      shopId: order.shopId,
      customerId: order.customerId,
      items: order.items,
      subtotal: order.pricing.subtotal,
      discount: order.pricing.discount,
      tax: order.pricing.tax,
      total: order.pricing.total,
      paymentStatus: order.payment.status === 'PAID' ? 'PAID' : 'UNPAID'
    });

    res.status(201).json({ success: true, message: 'Invoice generated successfully', data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
