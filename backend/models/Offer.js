import mongoose from 'mongoose';

const timelineItemSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderRole: {
      type: String,
      enum: ['buyer', 'seller'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be greater than 0']
    },
    message: {
      type: String,
      trim: true,
      default: ''
    },
    action: {
      type: String,
      enum: ['offer', 'counter', 'accept', 'reject', 'cancel'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const offerSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required']
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer reference is required']
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller reference is required']
    },
    // The current active offer amount
    amount: {
      type: Number,
      required: [true, 'Offer amount is required'],
      min: [1, 'Offer amount must be greater than 0']
    },
    // The latest message accompanying the offer/counter
    message: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'countered', 'waiting_seller_confirmation', 'deal_confirmed', 'rejected', 'cancelled', 'expired'],
      default: 'pending'
    },
    // Tracks who made the most recent offer / counteroffer
    lastOfferedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastOfferedRole: {
      type: String,
      enum: ['buyer', 'seller'],
      required: true
    },
    // Complete audit log of each turn in the negotiation
    history: {
      type: [timelineItemSchema],
      default: []
    },
    // Populated when the buyer accepts the current proposed price.
    agreedPrice: {
      type: Number,
      default: null
    },
    dealAgreedAt: {
      type: Date,
      default: null
    },
    dealConfirmedAt: {
      type: Date,
      default: null
    },
    deliveryAddress: {
      addressLine1: { type: String, trim: true, default: '' },
      addressLine2: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      postalCode: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'India' }
    },
    parentOffer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
      default: null
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiration
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying a buyer's offer on a specific product
offerSchema.index({ product: 1, buyer: 1 });
offerSchema.index({ seller: 1, status: 1 });
offerSchema.index({ buyer: 1, status: 1 });

const Offer = mongoose.model('Offer', offerSchema);

export default Offer;
