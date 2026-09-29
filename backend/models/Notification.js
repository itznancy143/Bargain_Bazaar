import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user reference is required'],
      index: true
    },
    dedupeKey: {
      type: String,
      select: false
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: [
        'offer_received',
        'counteroffer_received',
        'offer_accepted',
        'offer_rejected',
        'deal_confirmed',
        'order_created',
        'order_status_changed',
        'order_delivered',
        'review_submitted',
        'general'
      ]
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    link: {
      type: String,
      trim: true,
      default: ''
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null
    },
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
      default: null
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Performance indexes for fetching a user's notification feed and unread counts
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
