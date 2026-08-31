import PriceMaster from '../../models/PriceMaster.js';
import PriceHistory from '../../models/PriceHistory.js';
import { logAudit } from '../../services/auditService.js';

// @desc    Get all active prices (Public / Authenticated users)
// @route   GET /api/v1/prices or /api/price-master
// @access  Private
export const getPrices = async (req, res) => {
  try {
    const prices = await PriceMaster.find({ active: true }).sort({ garmentType: 1 });
    res.json({ success: true, count: prices.length, data: prices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching price catalogue', error: error.message });
  }
};

// @desc    Create or update price entry (Super Admin only)
// @route   POST /api/v1/admin/prices or PATCH /api/price-master
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
      price, // backward compatibility
      reason = 'Price Catalogue Update' 
    } = req.body;

    const nPrice = normalPrice || price || 100;
    const uPrice = urgentPrice || Math.round(nPrice * 1.5);
    const vuPrice = veryUrgentPrice || Math.round(nPrice * 2.0);
    const vPrice = vipPrice || Math.round(nPrice * 2.5);
    const fPrice = festivalPrice || Math.round(nPrice * 1.75);

    const existing = await PriceMaster.findOne({ garmentType, alterationType });
    
    if (existing) {
      // Record historical price snapshot
      await PriceHistory.create({
        priceId: existing._id,
        oldPrice: {
          normalPrice: existing.normalPrice,
          urgentPrice: existing.urgentPrice,
          veryUrgentPrice: existing.veryUrgentPrice,
          vipPrice: existing.vipPrice,
          festivalPrice: existing.festivalPrice
        },
        newPrice: {
          normalPrice: nPrice,
          urgentPrice: uPrice,
          veryUrgentPrice: vuPrice,
          vipPrice: vPrice,
          festivalPrice: fPrice
        },
        changedBy: req.user._id,
        reason
      });

      existing.normalPrice = nPrice;
      existing.urgentPrice = uPrice;
      existing.veryUrgentPrice = vuPrice;
      existing.vipPrice = vPrice;
      existing.festivalPrice = fPrice;
      await existing.save();

      await logAudit({
        userId: req.user._id,
        role: req.user.role,
        action: 'PRICE_UPDATE',
        module: 'PRICING',
        entityType: 'PriceMaster',
        entityId: existing._id,
        oldData: { normalPrice: existing.normalPrice },
        newData: { normalPrice: nPrice },
        req
      });

      return res.json({ success: true, message: 'Price updated successfully', data: existing });
    }

    const newPrice = await PriceMaster.create({
      garmentType,
      alterationType,
      normalPrice: nPrice,
      urgentPrice: uPrice,
      veryUrgentPrice: vuPrice,
      vipPrice: vPrice,
      festivalPrice: fPrice
    });

    res.status(201).json({ success: true, message: 'Price created successfully', data: newPrice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving price', error: error.message });
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
