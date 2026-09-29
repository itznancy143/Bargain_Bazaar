import mongoose from 'mongoose';
import Order from '../models/Order.js';
import { createNotification } from '../utils/notificationHelper.js';

const PRODUCT_FIELDS = 'title images image askingPrice condition location category brand';
const USER_FIELDS = 'name email avatar role';
const ORDER_STATUSES = ['pending_payment', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_TRANSITIONS = {
  pending_payment: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
};

const normalizeOrderStatus = (order) => {
  if (order && !order.orderStatus) order.orderStatus = 'pending_payment';
  return order;
};

const populateOrder = (query) => query
  .populate('product', PRODUCT_FIELDS)
  .populate('buyer', USER_FIELDS)
  .populate('seller', USER_FIELDS)
  .populate('offer', 'amount agreedPrice status dealConfirmedAt');

export const getMyOrders = async (req, res) => {
  try {
    const orders = (await populateOrder(Order.find({ buyer: req.user._id }).sort({ createdAt: -1 }))).map(normalizeOrderStatus);
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve your orders', error: error.message });
  }
};

export const getSellerOrders = async (req, res) => {
  try {
    const orders = (await populateOrder(Order.find({ seller: req.user._id }).sort({ createdAt: -1 }))).map(normalizeOrderStatus);
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

    normalizeOrderStatus(order);
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

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Allowed values: ${ORDER_STATUSES.join(', ')}.`
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const currentStatus = order.orderStatus || 'pending_payment';
    const userId = req.user._id.toString();
    const buyerId = order.buyer.toString();
    const sellerId = order.seller.toString();
    const isSeller = userId === sellerId;
    const isBuyer = userId === buyerId;
    const isCancellation = status === 'cancelled';
    const isSellerTransition =
      (currentStatus === 'pending_payment' && status === 'processing') ||
      (currentStatus === 'processing' && status === 'shipped');
    const isBuyerDelivery = currentStatus === 'shipped' && status === 'delivered';

    if (!isSeller && !isBuyer) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this order.' });
    }

    if (isCancellation && !['pending_payment', 'processing'].includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Orders can only be cancelled before they are shipped.'
      });
    }

    if (!STATUS_TRANSITIONS[currentStatus]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change order status from ${currentStatus} to ${status}.`
      });
    }

    if (isSellerTransition && !isSeller) {
      return res.status(403).json({ success: false, message: 'Only the seller associated with this order can advance shipping status.' });
    }

    if (isBuyerDelivery && !isBuyer) {
      return res.status(403).json({ success: false, message: 'Only the buyer associated with this order can mark it delivered.' });
    }

    order.orderStatus = status;
    await order.save();

    const updatedOrder = normalizeOrderStatus(await populateOrder(Order.findById(order._id)));
    const productTitle = updatedOrder.product?.title || 'product';

    if (status === 'processing') {
      await createNotification({
        recipient: order.buyer,
        eventKey: `order:${order._id}:status:${status}`,
        type: 'order_status_changed',
        title: 'Order Processing',
        message: `Your order for "${productTitle}" is now processing.`,
        link: `/orders/${order._id}`,
        product: updatedOrder.product?._id || order.product,
        order: order._id
      });
    } else if (status === 'shipped') {
      await createNotification({
        recipient: order.buyer,
        eventKey: `order:${order._id}:status:${status}`,
        type: 'order_status_changed',
        title: 'Order Shipped',
        message: `Your order for "${productTitle}" has been shipped.`,
        link: `/orders/${order._id}`,
        product: updatedOrder.product?._id || order.product,
        order: order._id
      });
    } else if (status === 'delivered') {
      // Notify buyer with review prompt
      await createNotification({
        recipient: order.buyer,
        eventKey: `order:${order._id}:status:${status}`,
        type: 'order_delivered',
        title: 'Order Delivered',
        message: `Your order for "${productTitle}" has been delivered. You can now leave a review.`,
        link: `/orders/${order._id}`,
        product: updatedOrder.product?._id || order.product,
        order: order._id
      });
      // Also notify seller
      await createNotification({
        recipient: order.seller,
        eventKey: `order:${order._id}:status:${status}`,
        type: 'order_status_changed',
        title: 'Order Delivered',
        message: `Order for "${productTitle}" has been delivered.`,
        link: `/orders/${order._id}`,
        product: updatedOrder.product?._id || order.product,
        order: order._id
      });
    } else if (status === 'cancelled') {
      const cancelRecipient = isSeller ? order.buyer : order.seller;
      const cancelMessage = isSeller
        ? `Your order for "${productTitle}" has been cancelled.`
        : `Order for "${productTitle}" has been cancelled by the buyer.`;

      await createNotification({
        recipient: cancelRecipient,
        eventKey: `order:${order._id}:status:${status}`,
        type: 'order_status_changed',
        title: 'Order Cancelled',
        message: cancelMessage,
        link: `/orders/${order._id}`,
        product: updatedOrder.product?._id || order.product,
        order: order._id
      });
    }

    return res.status(200).json({ success: true, message: `Order status updated to ${status}.`, order: updatedOrder });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update order status', error: error.message });
  }
};