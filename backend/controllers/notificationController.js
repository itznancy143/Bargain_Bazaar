import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

const SAFE_PRODUCT_FIELDS = 'title image images askingPrice condition category status';

/**
 * @desc    Get current authenticated user's notifications
 * @route   GET /api/notifications
 * @access  Private
 */
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 50, page = 1, unreadOnly } = req.query;

    const query = { recipient: userId };
    if (unreadOnly === 'true' || unreadOnly === true) {
      query.read = false;
    }

    const numericLimit = Math.min(Math.max(1, Number(limit) || 50), 100);
    const numericPage = Math.max(1, Number(page) || 1);
    const skip = (numericPage - 1) * numericLimit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('product', SAFE_PRODUCT_FIELDS)
        .sort({ createdAt: -1 })
        .limit(numericLimit)
        .skip(skip),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: userId, read: false })
    ]);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      page: numericPage,
      totalPages: Math.ceil(total / numericLimit),
      notifications
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
      error: error.message
    });
  }
};

/**
 * @desc    Get current user's unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Notification.countDocuments({
      recipient: userId,
      read: false
    });

    return res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve unread notification count',
      error: error.message
    });
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private (Owner only)
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Security: Only mark as read if it belongs to the authenticated user
    const notification = await Notification.findOne({
      _id: id,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    await notification.save();

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification,
      unreadCount
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
};

/**
 * @desc    Mark all notifications as read for the current user
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private (Owner only)
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false
    });

    return res.status(200).json({
      success: true,
      message: 'Notification deleted',
      unreadCount
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};
