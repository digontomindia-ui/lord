import Customer from '../../models/Customer.js';
import Order from '../../models/Order.js';
import Shop from '../../models/Shop.js';
import { getNextCode } from '../../services/counterService.js';

const resolveShopId = async (user) => {
  if (user.role === 'SUPER_ADMIN') return null;
  const shop = await Shop.findOne({ userId: user._id });
  return shop ? shop._id : user._id;
};

// @desc    Create a new customer (Shop scoped)
// @route   POST /api/v1/shop/customers or /api/customers
// @access  Private (SHOP, SUPER_ADMIN)
export const createCustomer = async (req, res) => {
  try {
    const { name, mobile, email, address } = req.body;
    if (!name || !mobile) {
      return res.status(400).json({ success: false, message: 'Name and mobile are required' });
    }

    const effectiveShopId = req.user.role === 'SUPER_ADMIN' && req.body.shopId 
      ? req.body.shopId 
      : await resolveShopId(req.user);

    const existing = await Customer.findOne({ shopId: effectiveShopId, mobile: mobile.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Customer with this mobile already exists in your shop' });
    }

    const customerCode = await getNextCode('customer', 'CST');

    const customer = await Customer.create({
      shopId: effectiveShopId,
      customerCode,
      name: name.trim(),
      mobile: mobile.trim(),
      email: email ? email.trim() : undefined,
      address
    });

    res.status(201).json({ success: true, message: 'Customer created successfully', data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating customer', error: error.message });
  }
};

// @desc    Get paginated customers (Shop scoped)
// @route   GET /api/v1/shop/customers or /api/customers
// @access  Private (SHOP, SUPER_ADMIN)
export const getCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const effectiveShopId = req.user.role === 'SUPER_ADMIN' && req.query.shopId 
      ? req.query.shopId 
      : (req.user.role === 'SUPER_ADMIN' ? null : await resolveShopId(req.user));

    const query = {};
    if (effectiveShopId) {
      query.shopId = effectiveShopId;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { customerCode: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Customer.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching customers', error: error.message });
  }
};

// @desc    Get customer by ID
// @route   GET /api/v1/shop/customers/:id or /api/customers/:id
// @access  Private (SHOP, SUPER_ADMIN)
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const effectiveShopId = await resolveShopId(req.user);
    if (req.user.role !== 'SUPER_ADMIN' && String(customer.shopId) !== String(effectiveShopId) && String(customer.shopId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied to this customer record' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching customer', error: error.message });
  }
};

// @desc    Update customer
// @route   PATCH /api/v1/shop/customers/:id or /api/customers/:id
// @access  Private (SHOP, SUPER_ADMIN)
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const effectiveShopId = await resolveShopId(req.user);
    if (req.user.role !== 'SUPER_ADMIN' && String(customer.shopId) !== String(effectiveShopId) && String(customer.shopId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { name, mobile, email, address } = req.body;
    if (name) customer.name = name;
    if (mobile) customer.mobile = mobile;
    if (email) customer.email = email;
    if (address) customer.address = address;

    await customer.save();
    res.json({ success: true, message: 'Customer updated successfully', data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating customer', error: error.message });
  }
};

// @desc    Get customer orders
// @route   GET /api/v1/shop/customers/:id/orders
// @access  Private (SHOP, SUPER_ADMIN)
export const getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching customer orders', error: error.message });
  }
};
