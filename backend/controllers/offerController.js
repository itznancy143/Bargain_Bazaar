import mongoose from 'mongoose';
import Offer from '../models/Offer.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

// Safe product fields to populate (SECURITY: minimumPrice is NEVER included)
const SAFE_PRODUCT_FIELDS = 'title images image askingPrice originalPrice condition location category categorySlug status isNegotiable brand seller';
const SAFE_USER_FIELDS = 'name email role createdAt';

/**
 * @desc    Create a new offer on a product
 * @route   POST /api/offers
 * @access  Private (Authenticated Buyer)
 */
export const createOffer = async (req, res) => {
  try {
    const { productId, amount, message } = req.body;

    // 1. Validate required inputs
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required to make an offer'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const offerAmount = Number(amount);
    if (isNaN(offerAmount) || offerAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Offer amount must be a valid number greater than 0'
      });
    }

    // 2. Fetch product and verify existence & active status
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product listing not found'
      });
    }

    if (product.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot place an offer. This product is currently ${product.status}.`
      });
    }

    // 3. Ownership Rule: Buyer cannot make an offer on their own product
    const sellerId = product.seller.toString();
    const buyerId = req.user._id.toString();

    if (sellerId === buyerId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot make a bargain offer on your own product listing.'
      });
    }

    // 4. Check if there's already an active negotiation between this buyer & product
    let activeOffer = await Offer.findOne({
      product: productId,
      buyer: buyerId,
      status: { $in: ['pending', 'countered'] }
    });

    if (activeOffer) {
      // If the buyer already made the last offer and it's still pending
      if (activeOffer.lastOfferedBy.toString() === buyerId) {
        return res.status(400).json({
          success: false,
          message: 'You already have an active pending offer on this product. Please wait for the seller to respond.',
          offerId: activeOffer._id
        });
      }

      // If seller had countered, treat this new submission as a counteroffer
      activeOffer.amount = offerAmount;
      activeOffer.message = message ? message.trim() : '';
      activeOffer.status = 'countered';
      activeOffer.lastOfferedBy = req.user._id;
      activeOffer.lastOfferedRole = 'buyer';
      activeOffer.history.push({
        sender: req.user._id,
        senderRole: 'buyer',
        amount: offerAmount,
        message: message ? message.trim() : '',
        action: 'counter',
        createdAt: new Date()
      });

      await activeOffer.save();

      const populatedOffer = await Offer.findById(activeOffer._id)
        .populate('product', SAFE_PRODUCT_FIELDS)
        .populate('buyer', SAFE_USER_FIELDS)
        .populate('seller', SAFE_USER_FIELDS)
        .populate('history.sender', SAFE_USER_FIELDS);

      return res.status(200).json({
        success: true,
        message: 'Counteroffer submitted successfully on existing negotiation.',
        offer: populatedOffer
      });
    }

    // 5. Create new Offer document
    const newOffer = await Offer.create({
      product: product._id,
      buyer: req.user._id,
      seller: product.seller, // Sourced securely from verified DB product
      amount: offerAmount,
      message: message ? message.trim() : '',
      status: 'pending',
      lastOfferedBy: req.user._id,
      lastOfferedRole: 'buyer',
      history: [
        {
          sender: req.user._id,
          senderRole: 'buyer',
          amount: offerAmount,
          message: message ? message.trim() : '',
          action: 'offer',
          createdAt: new Date()
        }
      ]
    });

    // 6. Populate and return sanitized offer
    const populatedOffer = await Offer.findById(newOffer._id)
      .populate('product', SAFE_PRODUCT_FIELDS)
      .populate('buyer', SAFE_USER_FIELDS)
      .populate('seller', SAFE_USER_FIELDS)
      .populate('history.sender', SAFE_USER_FIELDS);

    return res.status(201).json({
      success: true,
      message: 'Offer placed successfully!',
      offer: populatedOffer
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while creating offer',
      error: error.message
    });
  }
};

/**
 * @desc    Get all offers involving the authenticated user
 * @route   GET /api/offers/my
 * @access  Private
 */
export const getMyOffers = async (req, res) => {
  try {
    const { role, status } = req.query;
    const userId = req.user._id;

    let filter = {};

    if (role === 'buyer') {
      filter.buyer = userId;
    } else if (role === 'seller') {
      filter.seller = userId;
    } else {
      filter.$or = [{ buyer: userId }, { seller: userId }];
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const offers = await Offer.find(filter)
      .populate('product', SAFE_PRODUCT_FIELDS)
      .populate('buyer', SAFE_USER_FIELDS)
      .populate('seller', SAFE_USER_FIELDS)
      .populate('history.sender', SAFE_USER_FIELDS)
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: offers.length,
      offers
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve offers',
      error: error.message
    });
  }
};

/**
 * @desc    Get active offer for a specific product and user
 * @route   GET /api/offers/product/:productId
 * @access  Private
 */
export const getOfferByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const offer = await Offer.findOne({
      product: productId,
      $or: [{ buyer: userId }, { seller: userId }]
    })
      .populate('product', SAFE_PRODUCT_FIELDS)
      .populate('buyer', SAFE_USER_FIELDS)
      .populate('seller', SAFE_USER_FIELDS)
      .populate('history.sender', SAFE_USER_FIELDS)
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      offer: offer || null
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to check product offer',
      error: error.message
    });
  }
};

/**
 * @desc    Get specific negotiation details by Offer ID
 * @route   GET /api/offers/:id
 * @access  Private (Participants only)
 */
export const getOfferById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Negotiation offer not found'
      });
    }

    const offer = await Offer.findById(id)
      .populate('product', SAFE_PRODUCT_FIELDS)
      .populate('buyer', SAFE_USER_FIELDS)
      .populate('seller', SAFE_USER_FIELDS)
      .populate('history.sender', SAFE_USER_FIELDS);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    // Authorization: Requester must be the buyer or seller
    const userId = req.user._id.toString();
    const buyerId = offer.buyer?._id ? offer.buyer._id.toString() : offer.buyer.toString();
    const sellerId = offer.seller?._id ? offer.seller._id.toString() : offer.seller.toString();

    if (userId !== buyerId && userId !== sellerId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this negotiation.'
      });
    }

    const isBuyer = userId === buyerId;
    const isSeller = userId === sellerId;
    const isMyTurn = (offer.status === 'pending' || offer.status === 'countered') &&
      offer.lastOfferedBy.toString() !== userId;

    return res.status(200).json({
      success: true,
      offer,
      isBuyer,
      isSeller,
      isMyTurn
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve offer details',
      error: error.message
    });
  }
};

/**
 * @desc    Accept an active offer / counteroffer -> waiting for seller confirmation
 * @route   PUT /api/offers/:id/accept
 * @access  Private (Recipient turn only)
 */
export const acceptOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    const buyerId = offer.buyer.toString();
    const sellerId = offer.seller.toString();

    // 1. Authorization: Must be buyer or seller
    if (userId !== buyerId && userId !== sellerId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to accept this offer.'
      });
    }

    // 2. State Check: Can only accept active pending or countered offers
    if (!['pending', 'countered'].includes(offer.status)) {
      return res.status(400).json({
        success: false,
        message: `This offer cannot be accepted because it is already ${offer.status}.`
      });
    }

    // 3. Turn Check: The participant accepting the offer CANNOT be the one who made it
    if (offer.lastOfferedBy.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot accept your own offer. Waiting for the other party to respond.'
      });
    }

    const isBuyer = userId === buyerId;
    const userRole = isBuyer ? 'buyer' : 'seller';

    if (isBuyer) {
      const address = req.body.deliveryAddress || {};
      const requiredAddressFields = ['addressLine1', 'city', 'state', 'postalCode'];
      const hasInvalidAddress = requiredAddressFields.some((field) => !String(address[field] || '').trim());

      if (hasInvalidAddress) {
        return res.status(400).json({
          success: false,
          message: 'Delivery address must include address line, city, state, and postal code.'
        });
      }

      offer.deliveryAddress = {
        addressLine1: String(address.addressLine1).trim(),
        addressLine2: String(address.addressLine2 || '').trim(),
        city: String(address.city).trim(),
        state: String(address.state).trim(),
        postalCode: String(address.postalCode).trim(),
        country: String(address.country || 'India').trim()
      };
    }

    // 4. A buyer acceptance is ready for seller confirmation. A seller
    // acceptance remains an active seller proposal so the buyer can
    // acknowledge the price and provide the delivery address first.
    offer.status = isBuyer ? 'waiting_seller_confirmation' : 'countered';
    offer.agreedPrice = isBuyer ? offer.amount : null;
    offer.dealAgreedAt = isBuyer ? new Date() : null;
    offer.history.push({
      sender: req.user._id,
      senderRole: userRole,
      amount: offer.amount,
      message: message ? message.trim() : 'Price accepted. Waiting for seller confirmation.',
      action: 'accept',
      createdAt: new Date()
    });

    await offer.save();

    const populatedOffer = await Offer.findById(offer._id)
      .populate('product', SAFE_PRODUCT_FIELDS)
      .populate('buyer', SAFE_USER_FIELDS)
      .populate('seller', SAFE_USER_FIELDS)
      .populate('history.sender', SAFE_USER_FIELDS);

    return res.status(200).json({
      success: true,
      message: isBuyer
        ? `Price accepted at ₹${Number(offer.agreedPrice).toLocaleString('en-IN')}. Waiting for seller confirmation.`
        : `Seller accepted the offer at ₹${Number(offer.amount).toLocaleString('en-IN')}. Waiting for buyer confirmation.`,
      offer: populatedOffer
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to accept offer',
      error: error.message
    });
  }
};

/**
 * @desc    Confirm a deal after the buyer accepts the proposed price
 * @route   PUT /api/offers/:id/confirm-deal
 * @access  Private (Product seller only)
 */
export const confirmDeal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    // Derive the seller from the product in the database. Never trust a sellerId from the client.
    const product = await Product.findById(offer.product).select('seller');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product listing not found'
      });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the seller can confirm the deal.'
      });
    }

    if (offer.status === 'deal_confirmed') {
      const existingOrder = await Order.findOne({ offer: offer._id });
      const populatedOffer = await Offer.findById(offer._id)
        .populate('product', SAFE_PRODUCT_FIELDS)
        .populate('buyer', SAFE_USER_FIELDS)
        .populate('seller', SAFE_USER_FIELDS)
        .populate('history.sender', SAFE_USER_FIELDS);

      return res.status(200).json({
        success: true,
        message: `Deal confirmed at ₹${Number(offer.agreedPrice).toLocaleString('en-IN')}.`,
        offer: populatedOffer,
        orderId: existingOrder?.orderId
      });
    }

    if (offer.status !== 'waiting_seller_confirmation') {
      return res.status(400).json({
        success: false,
        message: `This deal is not ready for seller confirmation because it is ${offer.status}.`
      });
    }

    const latestHistoryItem = offer.history[offer.history.length - 1];
    const buyerAcceptedCurrentCounter = latestHistoryItem &&
      latestHistoryItem.action === 'accept' &&
      latestHistoryItem.senderRole === 'buyer' &&
      latestHistoryItem.sender.toString() === offer.buyer.toString() &&
      offer.lastOfferedRole === 'seller';

    if (!buyerAcceptedCurrentCounter) {
      return res.status(400).json({
        success: false,
        message: 'The buyer must accept the current seller counteroffer before the deal can be confirmed.'
      });
    }

    const address = offer.deliveryAddress || {};
    const requiredAddressFields = ['addressLine1', 'city', 'state', 'postalCode'];
    if (requiredAddressFields.some((field) => !String(address[field] || '').trim())) {
      return res.status(400).json({
        success: false,
        message: 'The buyer must provide a complete delivery address before the deal can be confirmed.'
      });
    }

    let order = await Order.findOne({ offer: offer._id });
    if (!order) {
      try {
        order = await Order.create({
          orderId: `BB-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          product: offer.product,
          buyer: offer.buyer,
          seller: product.seller,
          offer: offer._id,
          agreedPrice: offer.agreedPrice,
          quantity: 1,
          totalAmount: offer.agreedPrice,
          deliveryAddress: address,
          orderStatus: 'pending_payment',
          paymentStatus: 'unpaid'
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        order = await Order.findOne({ offer: offer._id });
      }
    }

    const confirmedOffer = await Offer.findOneAndUpdate(
      { _id: offer._id, status: 'waiting_seller_confirmation' },
      { $set: { status: 'deal_confirmed', dealConfirmedAt: new Date() } },
      { new: true }
    );

    const finalOffer = confirmedOffer || await Offer.findById(offer._id);

    const populatedOffer = await Offer.findById(finalOffer._id)
      .populate('product', SAFE_PRODUCT_FIELDS)
      .populate('buyer', SAFE_USER_FIELDS)
      .populate('seller', SAFE_USER_FIELDS)
      .populate('history.sender', SAFE_USER_FIELDS);

    return res.status(200).json({
      success: true,
      message: `Deal confirmed at ₹${Number(finalOffer.agreedPrice).toLocaleString('en-IN')}.`,
      offer: populatedOffer,
      orderId: order.orderId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to confirm deal',
      error: error.message
    });
  }
};

/**
 * @desc    Reject an active offer / counteroffer
 * @route   PUT /api/offers/:id/reject
 * @access  Private (Recipient turn only)
 */
export const rejectOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    const buyerId = offer.buyer.toString();
    const sellerId = offer.seller.toString();

    // 1. Authorization: Must be buyer or seller
    if (userId !== buyerId && userId !== sellerId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reject this offer.'
      });
    }

    // 2. State Check: Can only reject pending or countered offers
    if (!['pending', 'countered'].includes(offer.status)) {
      return res.status(400).json({
        success: false,
        message: `This negotiation is already ${offer.status} and cannot be modified.`
      });
    }

    const isBuyer = userId === buyerId;
    const userRole = isBuyer ? 'buyer' : 'seller';

    // 3. Mark as rejected
    offer.status = 'rejected';
    offer.history.push({
      sender: req.user._id,
      senderRole: userRole,
      amount: offer.amount,
      message: message ? message.trim() : 'Offer declined.',
      action: 'reject',
      createdAt: new Date()
    });

    await offer.save();

    const populatedOffer = await Offer.findById(offer._id)
      .populate('product', SAFE_PRODUCT_FIELDS)
      .populate('buyer', SAFE_USER_FIELDS)
      .populate('seller', SAFE_USER_FIELDS)
      .populate('history.sender', SAFE_USER_FIELDS);

    return res.status(200).json({
      success: true,
      message: 'Offer has been rejected.',
      offer: populatedOffer
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reject offer',
      error: error.message
    });
  }
};

/**
 * @desc    Submit a counteroffer
 * @route   POST /api/offers/:id/counter
 * @access  Private (Recipient turn only)
 */
export const counterOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, message } = req.body;
    const userId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    const counterAmount = Number(amount);
    if (isNaN(counterAmount) || counterAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Counteroffer amount must be a valid number greater than 0'
      });
    }

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    const buyerId = offer.buyer.toString();
    const sellerId = offer.seller.toString();

    // 1. Authorization: Must be buyer or seller
    if (userId !== buyerId && userId !== sellerId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to make a counteroffer on this negotiation.'
      });
    }

    // 2. State Check: Can only counter pending or countered offers
    if (!['pending', 'countered'].includes(offer.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot counteroffer. Negotiation is already ${offer.status}.`
      });
    }

    // 3. Turn Check: Cannot counter your own offer without the other party's turn
    if (offer.lastOfferedBy.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot submit consecutive counteroffers. Please wait for the other party to respond.'
      });
    }

    const isBuyer = userId === buyerId;
    const senderRole = isBuyer ? 'buyer' : 'seller';

    // 4. Update Offer
    offer.amount = counterAmount;
    offer.message = message ? message.trim() : '';
    offer.status = 'countered';
    offer.lastOfferedBy = req.user._id;
    offer.lastOfferedRole = senderRole;
    offer.history.push({
      sender: req.user._id,
      senderRole,
      amount: counterAmount,
      message: message ? message.trim() : '',
      action: 'counter',
      createdAt: new Date()
    });

    await offer.save();

    const populatedOffer = await Offer.findById(offer._id)
      .populate('product', SAFE_PRODUCT_FIELDS)
      .populate('buyer', SAFE_USER_FIELDS)
      .populate('seller', SAFE_USER_FIELDS)
      .populate('history.sender', SAFE_USER_FIELDS);

    return res.status(200).json({
      success: true,
      message: `Counteroffer of ₹${Number(counterAmount).toLocaleString('en-IN')} submitted successfully!`,
      offer: populatedOffer
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit counteroffer',
      error: error.message
    });
  }
};
