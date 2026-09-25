import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USER_FIELDS = 'name email avatar role';

// Helper to remove files from disk safely
const deleteUploadedFiles = async (files) => {
  if (!files || !Array.isArray(files)) return;
  for (const file of files) {
    try {
      const filePath = file.filename
        ? path.join(__dirname, '..', 'uploads', 'reviews', file.filename)
        : file.path
        ? file.path
        : null;

      if (filePath && fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      console.error('Failed to cleanup file:', err.message);
    }
  }
};

/**
 * @desc    Submit a review with optional photos for a delivered order
 * @route   POST /api/reviews
 * @access  Private (Delivered order buyer only)
 */
export const createReview = async (req, res) => {
  const uploadedFiles = req.files || [];

  try {
    const { orderId, rating, comment } = req.body;

    // 1. Validate orderId
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      await deleteUploadedFiles(uploadedFiles);
      return res.status(400).json({
        success: false,
        message: 'A valid Order ID is required to submit a review.'
      });
    }

    // 2. Validate rating (must be an integer from 1 to 5)
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      await deleteUploadedFiles(uploadedFiles);
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.'
      });
    }

    // 3. Validate comment length
    const cleanComment = typeof comment === 'string' ? comment.trim() : '';
    if (cleanComment.length > 1000) {
      await deleteUploadedFiles(uploadedFiles);
      return res.status(400).json({
        success: false,
        message: 'Review comment cannot exceed 1000 characters.'
      });
    }

    // 4. Validate number of uploaded images (max 5)
    if (uploadedFiles.length > 5) {
      await deleteUploadedFiles(uploadedFiles);
      return res.status(400).json({
        success: false,
        message: 'You can attach a maximum of 5 photos per review.'
      });
    }

    // 5. Retrieve order and verify existence
    const order = await Order.findById(orderId);
    if (!order) {
      await deleteUploadedFiles(uploadedFiles);
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // 6. Check order delivery status
    if (order.orderStatus !== 'delivered') {
      await deleteUploadedFiles(uploadedFiles);
      return res.status(400).json({
        success: false,
        message: `Reviews can only be submitted for delivered orders. Current order status: "${order.orderStatus}".`
      });
    }

    // 7. Verify buyer ownership
    const currentUserId = req.user._id.toString();
    const buyerId = order.buyer.toString();
    const sellerId = order.seller.toString();

    if (currentUserId !== buyerId) {
      await deleteUploadedFiles(uploadedFiles);
      return res.status(403).json({
        success: false,
        message: 'Only the buyer of this delivered order can submit a review.'
      });
    }

    // 8. Prevent seller self-review
    if (currentUserId === sellerId) {
      await deleteUploadedFiles(uploadedFiles);
      return res.status(403).json({
        success: false,
        message: 'You cannot review a sale of your own product.'
      });
    }

    // 9. Check for existing review on this order
    const existingReview = await Review.findOne({ order: order._id });
    if (existingReview) {
      await deleteUploadedFiles(uploadedFiles);
      return res.status(400).json({
        success: false,
        message: 'A review has already been submitted for this order.'
      });
    }

    // 10. Format image records
    const images = uploadedFiles.map((file) => ({
      url: `/uploads/reviews/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname
    }));

    // 11. Derive product and seller securely from the verified Order document
    const review = await Review.create({
      order: order._id,
      product: order.product,
      buyer: req.user._id,
      seller: order.seller,
      rating: numRating,
      comment: cleanComment,
      images
    });

    const populatedReview = await Review.findById(review._id)
      .populate('buyer', USER_FIELDS)
      .populate('seller', USER_FIELDS);

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      review: populatedReview
    });
  } catch (error) {
    await deleteUploadedFiles(uploadedFiles);

    // Handle duplicate key error if concurrent requests arrive
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A review has already been submitted for this order.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to submit review.',
      error: error.message
    });
  }
};

/**
 * @desc    Get all reviews and rating summary for a product
 * @route   GET /api/reviews/product/:productId
 * @access  Public
 */
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format.'
      });
    }

    const reviews = await Review.find({ product: productId })
      .populate('buyer', USER_FIELDS)
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    let averageRating = 0;
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (totalReviews > 0) {
      const sum = reviews.reduce((acc, item) => {
        const r = item.rating;
        if (r >= 1 && r <= 5) {
          ratingBreakdown[r] = (ratingBreakdown[r] || 0) + 1;
        }
        return acc + r;
      }, 0);
      averageRating = Number((sum / totalReviews).toFixed(1));
    }

    return res.status(200).json({
      success: true,
      productId,
      totalReviews,
      averageRating,
      ratingBreakdown,
      reviews
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve product reviews.',
      error: error.message
    });
  }
};

/**
 * @desc    Get review associated with a specific order
 * @route   GET /api/reviews/order/:orderId
 * @access  Private / Authenticated
 */
export const getOrderReview = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format.'
      });
    }

    const review = await Review.findOne({ order: orderId })
      .populate('buyer', USER_FIELDS)
      .populate('seller', USER_FIELDS);

    return res.status(200).json({
      success: true,
      review: review || null
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve order review.',
      error: error.message
    });
  }
};

/**
 * @desc    Get reviews for a specific seller
 * @route   GET /api/reviews/seller/:sellerId
 * @access  Public
 */
export const getSellerReviews = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seller ID format.'
      });
    }

    const reviews = await Review.find({ seller: sellerId })
      .populate('buyer', USER_FIELDS)
      .populate('product', 'title image images askingPrice')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    let averageRating = 0;

    if (totalReviews > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      averageRating = Number((sum / totalReviews).toFixed(1));
    }

    return res.status(200).json({
      success: true,
      sellerId,
      totalReviews,
      averageRating,
      reviews
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve seller reviews.',
      error: error.message
    });
  }
};

/**
 * @desc    Update a review (Only author buyer can update)
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.'
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.'
      });
    }

    // Verify authorship
    if (review.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own review.'
      });
    }

    if (rating !== undefined) {
      const numRating = Number(rating);
      if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be an integer between 1 and 5.'
        });
      }
      review.rating = numRating;
    }

    if (comment !== undefined) {
      const cleanComment = typeof comment === 'string' ? comment.trim() : '';
      if (cleanComment.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Review comment cannot exceed 1000 characters.'
        });
      }
      review.comment = cleanComment;
    }

    await review.save();

    const updatedReview = await Review.findById(review._id)
      .populate('buyer', USER_FIELDS)
      .populate('seller', USER_FIELDS);

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully.',
      review: updatedReview
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update review.',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a review (Only author buyer or admin can delete)
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.'
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.'
      });
    }

    // Verify authorship or admin role
    const isAuthor = review.buyer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own review.'
      });
    }

    // Clean up stored image files to prevent orphaned images
    if (review.images && review.images.length > 0) {
      await deleteUploadedFiles(review.images);
    }

    await Review.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete review.',
      error: error.message
    });
  }
};
