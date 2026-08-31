import PriceMaster from '../../models/PriceMaster.js';
import PriceHistory from '../../models/PriceHistory.js';
import { logAudit } from '../../services/auditService.js';

// @desc    Get all active prices (Public / Authenticated users)
// @route   GET /api/v1/prices or /api/price-master
// @access  Public / Private
export const getPrices = async (req, res) => {
  try {
    const prices = await PriceMaster.find({ active: { $ne: false } }).sort({ garmentType: 1, alterationType: 1 });
    res.json({ success: true, count: prices.length, data: prices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching price catalogue', error: error.message });
  }
};

// @desc    Create or update price entry (Super Admin only)
// @route   POST /api/v1/admin/prices or POST /api/prices
// @access  Private (SUPER_ADMIN)
export const savePrice = async (req, res) => {
  try {
    const { 
      garmentType, 
      alterationType, 
      normalPrice, 
      urgentPrice, 
      veryUrgentPrice, 
      vipPrice, 
      festivalPrice,
      price,
      reason = 'Price Catalogue Update' 
    } = req.body;

    if (!garmentType || !alterationType) {
      return res.status(400).json({ success: false, message: 'Garment type and alteration type are required' });
    }

    const nPrice = Number(normalPrice || price || 100);
    const uPrice = Number(urgentPrice || Math.round(nPrice * 1.5));
    const vuPrice = Number(veryUrgentPrice || Math.round(nPrice * 2.0));
    const vPrice = Number(vipPrice || Math.round(nPrice * 2.5));
    const fPrice = Number(festivalPrice || Math.round(nPrice * 1.75));

    const existing = await PriceMaster.findOne({ garmentType, alterationType });
    
    if (existing) {
      existing.normalPrice = nPrice;
      existing.urgentPrice = uPrice;
      existing.veryUrgentPrice = vuPrice;
      existing.vipPrice = vPrice;
      existing.festivalPrice = fPrice;
      existing.active = true;
      await existing.save();

      return res.json({ success: true, message: `Price updated for ${garmentType} - ${alterationType}`, data: existing });
    }

    const newPrice = await PriceMaster.create({
      garmentType,
      alterationType,
      normalPrice: nPrice,
      urgentPrice: uPrice,
      veryUrgentPrice: vuPrice,
      vipPrice: vPrice,
      festivalPrice: fPrice,
      active: true
    });

    res.status(201).json({ success: true, message: 'New price rule created successfully', data: newPrice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving price', error: error.message });
  }
};

// @desc    Update price by ID
// @route   PUT /api/v1/prices/:id or PATCH /api/prices/:id
// @access  Private (SUPER_ADMIN)
export const updatePriceById = async (req, res) => {
  try {
    const { normalPrice, urgentPrice, veryUrgentPrice, vipPrice, festivalPrice, active } = req.body;
    const priceDoc = await PriceMaster.findById(req.params.id);
    
    if (!priceDoc) {
      return res.status(404).json({ success: false, message: 'Price entry not found' });
    }

    if (normalPrice !== undefined) priceDoc.normalPrice = Number(normalPrice);
    if (urgentPrice !== undefined) priceDoc.urgentPrice = Number(urgentPrice);
    if (veryUrgentPrice !== undefined) priceDoc.veryUrgentPrice = Number(veryUrgentPrice);
    if (vipPrice !== undefined) priceDoc.vipPrice = Number(vipPrice);
    if (festivalPrice !== undefined) priceDoc.festivalPrice = Number(festivalPrice);
    if (active !== undefined) priceDoc.active = Boolean(active);

    await priceDoc.save();

    res.json({ success: true, message: 'Price updated successfully', data: priceDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete price rule by ID
// @route   DELETE /api/v1/prices/:id
// @access  Private (SUPER_ADMIN)
export const deletePrice = async (req, res) => {
  try {
    const priceDoc = await PriceMaster.findByIdAndDelete(req.params.id);
    if (!priceDoc) {
      return res.status(404).json({ success: false, message: 'Price entry not found' });
    }

    res.json({ success: true, message: `Price rule for ${priceDoc.garmentType} - ${priceDoc.alterationType} removed successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get price history for an entry
// @route   GET /api/v1/admin/prices/:id/history
// @access  Private (SUPER_ADMIN)
export const getPriceHistory = async (req, res) => {
  try {
    const history = await PriceHistory.find({ priceId: req.params.id })
      .populate('changedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
