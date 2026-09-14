import express from 'express';
import { getMyOrders, getSellerOrders, getOrderById, updateOrderStatus } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/my-orders', getMyOrders);
router.get('/seller-orders', getSellerOrders);
router.put('/:id/status', updateOrderStatus);
router.get('/:id', getOrderById);

export default router;