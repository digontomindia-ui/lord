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

// @desc    Download / view printable Tax Invoice (HTML / PDF printable)
// @route   GET /api/v1/invoices/:id/pdf or /api/v1/shop/invoices/:id/pdf
// @access  Private
export const downloadInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId')
      .populate('shopId')
      .populate('orderId');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (req.query.format === 'json') {
      return res.json({ success: true, data: invoice });
    }

    const shopName = invoice.shopId?.shopName || "LORD'S BESPOKE ATELIER";
    const shopPhone = invoice.shopId?.mobile || '+91 9999999999';
    const shopAddr = invoice.shopId?.address ? `${invoice.shopId.address.line1 || ''}, ${invoice.shopId.address.city || ''}` : 'Main Atelier Street, Mumbai';
    const custName = invoice.customerId?.name || 'Valued Bespoke Client';
    const custPhone = invoice.customerId?.mobile || '—';
    const orderNum = invoice.orderId?.orderNumber || 'ORD-2026';
    const invDate = new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const itemsHtml = (invoice.items || []).map((item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 12px; font-size: 13px;">${idx + 1}</td>
        <td style="padding: 10px 12px; font-size: 13px;">
          <strong>${item.garmentType}</strong><br/>
          <span style="color: #64748b; font-size: 11px;">${item.alterations?.type || 'Bespoke Alteration'}</span>
        </td>
        <td style="padding: 10px 12px; font-size: 13px; text-align: center;">${item.quantity || 1}</td>
        <td style="padding: 10px 12px; font-size: 13px; text-align: right;">₹${item.itemPrice || 0}</td>
        <td style="padding: 10px 12px; font-size: 13px; text-align: right; font-weight: 600;">₹${(item.itemPrice || 0) * (item.quantity || 1)}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Tax Invoice - ${invoice.invoiceNumber}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; background: #fff; }
        .invoice-card { max-width: 800px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 30px; border-radius: 8px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #d4af37; padding-bottom: 15px; }
        .brand { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
        .brand span { color: #d4af37; }
        .gold-banner { background: #fdfbf7; border: 1px solid #f5ebd3; padding: 12px 16px; border-radius: 6px; margin: 20px 0; display: flex; justify-content: space-between; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #f8fafc; text-align: left; padding: 10px 12px; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; }
        .totals { margin-top: 20px; display: flex; justify-content: flex-end; }
        .totals-table { width: 280px; }
        .totals-table td { padding: 6px 12px; font-size: 13px; }
        .print-btn { display: inline-block; padding: 8px 16px; background: #d4af37; color: #000; font-weight: 700; text-decoration: none; border-radius: 4px; cursor: pointer; border: none; }
        @media print { .no-print { display: none; } .invoice-card { border: none; padding: 0; } }
      </style>
    </head>
    <body>
      <div class="no-print" style="text-align: right; max-width: 800px; margin: 0 auto 15px auto;">
        <button onclick="window.print()" class="print-btn">Print / Save as PDF</button>
      </div>
      <div class="invoice-card">
        <div class="header">
          <div>
            <div class="brand">LORD'S <span>BESPOKE</span></div>
            <p style="margin: 4px 0; font-size: 12px; color: #64748b;">Premium Alteration & Craft Atelier</p>
            <p style="margin: 2px 0; font-size: 12px; color: #334155;"><strong>${shopName}</strong></p>
            <p style="margin: 2px 0; font-size: 11px; color: #64748b;">${shopAddr} • Tel: ${shopPhone}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; color: #d4af37; font-size: 20px; letter-spacing: 1px;">TAX INVOICE</h2>
            <p style="margin: 4px 0; font-size: 13px; font-weight: 700;"># ${invoice.invoiceNumber}</p>
            <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Date: ${invDate}</p>
            <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Order Ref: <strong>${orderNum}</strong></p>
          </div>
        </div>

        <div class="gold-banner">
          <div>
            <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">Billed To</span>
            <p style="margin: 3px 0 0 0; font-weight: 700; font-size: 14px;">${custName}</p>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">Mobile: ${custPhone}</p>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">Payment Status</span>
            <p style="margin: 3px 0 0 0; font-weight: 800; font-size: 14px; color: ${invoice.paymentStatus === 'PAID' ? '#16a34a' : '#ea580c'};">${invoice.paymentStatus || 'UNPAID'}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Garment & Alteration Specification</th>
              <th style="text-align: center; width: 60px;">Qty</th>
              <th style="text-align: right; width: 100px;">Rate</th>
              <th style="text-align: right; width: 100px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <table class="totals-table">
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right; font-weight: 600;">₹${invoice.subtotal || invoice.total}</td>
            </tr>
            ${invoice.discount ? `<tr><td>Discount:</td><td style="text-align: right; color: #16a34a;">-₹${invoice.discount}</td></tr>` : ''}
            ${invoice.tax ? `<tr><td>GST / Tax:</td><td style="text-align: right;">₹${invoice.tax}</td></tr>` : ''}
            <tr style="border-top: 2px solid #0f172a; font-size: 15px;">
              <td style="font-weight: 800; padding-top: 8px;">Grand Total:</td>
              <td style="text-align: right; font-weight: 800; color: #d4af37; padding-top: 8px;">₹${invoice.total}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 15px; font-size: 11px; color: #94a3b8; text-align: center;">
          Thank you for trusting Lord's Bespoke Alterations. Computer generated tax invoice.
        </div>
      </div>
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error rendering invoice PDF', error: error.message });
  }
};
