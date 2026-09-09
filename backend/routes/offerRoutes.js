import express from 'express';
import {
  createOffer,
  getMyOffers,
  getOfferByProduct,
  getOfferById,
  acceptOffer,
  confirmDeal,
  rejectOffer,
  counterOffer
} from '../controllers/offerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All offer routes require user authentication
router.use(protect);

// Create new offer
router.post('/', createOffer);

// Get user's received/sent offers
router.get('/my', getMyOffers);

// Check if user has active offer on product
router.get('/product/:productId', getOfferByProduct);

// Get single negotiation details
router.get('/:id', getOfferById);

// Accept offer / counteroffer -> Deal Agreed
router.put('/:id/accept', acceptOffer);

// Finalize a deal (seller authorization is enforced in the controller)
router.put('/:id/confirm-deal', confirmDeal);

// Reject offer / counteroffer
router.put('/:id/reject', rejectOffer);

// Make a counteroffer
router.post('/:id/counter', counterOffer);

export default router;
