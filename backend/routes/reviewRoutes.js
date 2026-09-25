import express from 'express';
import {
  createReview,
  getProductReviews,
  getOrderReview,
  getSellerReviews,
  updateReview,
  deleteReview
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadReviewPhotos } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes for reading reviews
router.get('/product/:productId', getProductReviews);
router.get('/seller/:sellerId', getSellerReviews);

// Protected routes for submitting and managing reviews
router.post('/', protect, uploadReviewPhotos, createReview);
router.get('/order/:orderId', protect, getOrderReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

export default router;
