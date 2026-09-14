import express from 'express';
import { getMyOrders, getSellerOrders, getOrderById } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/my-orders', getMyOrders);
router.get('/seller-orders', getSellerOrders);
router.get('/:id', getOrderById);

export default router;