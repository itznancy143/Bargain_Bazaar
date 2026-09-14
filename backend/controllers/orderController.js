import mongoose from 'mongoose';
import Order from '../models/Order.js';

const PRODUCT_FIELDS = 'title images image askingPrice condition location category brand';
const USER_FIELDS = 'name email avatar role';

const populateOrder = (query) => query
  .populate('product', PRODUCT_FIELDS)
  .populate('buyer', USER_FIELDS)
  .populate('seller', USER_FIELDS)
  .populate('offer', 'amount agreedPrice status dealConfirmedAt');

export const getMyOrders = async (req, res) => {
  try {
    const orders = await populateOrder(Order.find({ buyer: req.user._id }).sort({ createdAt: -1 }));
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve your orders', error: error.message });
  }
};

export const getSellerOrders = async (req, res) => {
  try {
    const orders = await populateOrder(Order.find({ seller: req.user._id }).sort({ createdAt: -1 }));
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve seller orders', error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = await populateOrder(Order.findById(req.params.id));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const userId = req.user._id.toString();
    const buyerId = order.buyer?._id?.toString();
    const sellerId = order.seller?._id?.toString();
    if (buyerId !== userId && sellerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this order.' });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve order', error: error.message });
  }
};