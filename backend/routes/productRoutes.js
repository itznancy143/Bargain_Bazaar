import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public & Filtered Catalog routes
router.get('/', getProducts);

// Seller My Products route (must come before /:id)
router.get('/my-products', protect, getMyProducts);

// Product Detail route
router.get('/:id', getProductById);

// Protected Seller routes (Add, Edit, Delete)
router.post('/', protect, createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

export default router;
