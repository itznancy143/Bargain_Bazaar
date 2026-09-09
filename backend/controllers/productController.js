import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Product from '../models/Product.js';
import User from '../models/User.js';

// @desc    Get all active products with filters and search
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      condition,
      location,
      minPrice,
      maxPrice,
      sortBy,
      limit = 50,
      page = 1
    } = req.query;

    const query = { status: 'active' };

    // Category filter
    if (category && category !== 'all') {
      const catLower = category.toLowerCase().trim();
      query.$or = [
        { categorySlug: catLower },
        { category: new RegExp(`^${catLower}$`, 'i') }
      ];
    }

    // Keyword Search filter across title, description, brand, location
    if (search && search.trim() !== '') {
      const q = search.trim();
      const searchRegex = new RegExp(q, 'i');
      const searchConditions = [
        { title: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { location: searchRegex }
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    // Condition filter
    if (condition && condition !== 'all') {
      query.condition = condition;
    }

    // Location filter
    if (location && location !== 'all') {
      query.location = new RegExp(location.trim(), 'i');
    }

    // Price range filter
    if (minPrice !== undefined && minPrice !== '') {
      query.askingPrice = { ...(query.askingPrice || {}), $gte: Number(minPrice) };
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      query.askingPrice = { ...(query.askingPrice || {}), $lte: Number(maxPrice) };
    }

    // Sorting
    let sortOptions = { featured: -1, createdAt: -1 };
    if (sortBy === 'price-low') {
      sortOptions = { askingPrice: 1 };
    } else if (sortBy === 'price-high') {
      sortOptions = { askingPrice: -1 };
    } else if (sortBy === 'newest') {
      sortOptions = { createdAt: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);

    // SECURITY: minimumPrice has select: false on schema, so it is omitted automatically
    const products = await Product.find(query)
      .populate('seller', 'name email role createdAt')
      .sort(sortOptions)
      .limit(Number(limit))
      .skip(skip);

    const total = await Product.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      products
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve products',
      error: error.message
    });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public (Reveals private minimumPrice only if authenticated owner requests it)
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found with this ID'
      });
    }

    // Check if requester has a valid JWT for ownership verification
    let requesterId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        requesterId = decoded.id;
      } catch {
        // Invalid token; proceed as public guest
      }
    }

    // Find base product
    const product = await Product.findById(id).populate('seller', 'name email role createdAt');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment views count asynchronously
    Product.findByIdAndUpdate(id, { $inc: { viewsCount: 1 } }).exec();

    // Check if requester is the seller
    const isOwner = requesterId && product.seller && product.seller._id.toString() === requesterId.toString();

    if (isOwner) {
      // Include minimumPrice for owner
      const ownerProduct = await Product.findById(id)
        .select('+minimumPrice')
        .populate('seller', 'name email role createdAt');

      return res.status(200).json({
        success: true,
        product: ownerProduct,
        isOwner: true
      });
    }

    // Public response: minimumPrice is completely excluded
    return res.status(200).json({
      success: true,
      product,
      isOwner: false
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve product details',
      error: error.message
    });
  }
};

// @desc    Create a new product listing (Seller only)
// @route   POST /api/products
// @access  Private
export const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      askingPrice,
      minimumPrice,
      originalPrice,
      condition,
      location,
      images,
      image,
      brand,
      isNegotiable
    } = req.body;

    // 1. Validation
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, and category'
      });
    }

    if (askingPrice === undefined || Number(askingPrice) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Asking price is required and must be greater than 0'
      });
    }

    if (minimumPrice === undefined || Number(minimumPrice) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Minimum private price is required and must be greater than 0'
      });
    }

    if (Number(minimumPrice) > Number(askingPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Minimum private price cannot be higher than the asking price'
      });
    }

    // 2. Format image arrays
    const formattedImages = Array.isArray(images) && images.length > 0
      ? images
      : image
      ? [image]
      : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'];

    const primaryImage = image || formattedImages[0];

    // 3. Create product associated with authenticated user
    const product = await Product.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      categorySlug: category.toLowerCase().replace(/\s+/g, '-').trim(),
      askingPrice: Number(askingPrice),
      minimumPrice: Number(minimumPrice),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      condition: condition || 'Good',
      location: location ? location.trim() : 'India',
      images: formattedImages,
      image: primaryImage,
      brand: brand ? brand.trim() : undefined,
      isNegotiable: isNegotiable !== undefined ? isNegotiable : true,
      seller: req.user._id,
      status: 'active'
    });

    return res.status(201).json({
      success: true,
      message: 'Product listed successfully',
      product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create product listing',
      error: error.message
    });
  }
};

// @desc    Get all products owned by authenticated seller
// @route   GET /api/products/my-products
// @access  Private
export const getMyProducts = async (req, res) => {
  try {
    // Seller is permitted to see their own private minimumPrice
    const products = await Product.find({ seller: req.user._id })
      .select('+minimumPrice')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your product listings',
      error: error.message
    });
  }
};

// @desc    Update an existing product (Seller only)
// @route   PUT /api/products/:id
// @access  Private
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found with this ID'
      });
    }

    const product = await Product.findById(id).select('+minimumPrice');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Ownership Authorization Check
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this product'
      });
    }

    const {
      title,
      description,
      category,
      askingPrice,
      minimumPrice,
      originalPrice,
      condition,
      location,
      images,
      image,
      brand,
      isNegotiable,
      status
    } = req.body;

    // Price validation if modified
    const updatedAsking = askingPrice !== undefined ? Number(askingPrice) : product.askingPrice;
    const updatedMin = minimumPrice !== undefined ? Number(minimumPrice) : product.minimumPrice;

    if (updatedAsking <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Asking price must be greater than 0'
      });
    }

    if (updatedMin <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Minimum price must be greater than 0'
      });
    }

    if (updatedMin > updatedAsking) {
      return res.status(400).json({
        success: false,
        message: 'Minimum private price cannot be greater than asking price'
      });
    }

    // Apply updates
    if (title) product.title = title.trim();
    if (description) product.description = description.trim();
    if (category) {
      product.category = category.trim();
      product.categorySlug = category.toLowerCase().replace(/\s+/g, '-').trim();
    }
    if (askingPrice !== undefined) product.askingPrice = Number(askingPrice);
    if (minimumPrice !== undefined) product.minimumPrice = Number(minimumPrice);
    if (originalPrice !== undefined) product.originalPrice = Number(originalPrice);
    if (condition) product.condition = condition;
    if (location) product.location = location.trim();
    if (images && Array.isArray(images)) {
      product.images = images;
      if (images.length > 0) product.image = images[0];
    }
    if (image) product.image = image;
    if (brand !== undefined) product.brand = brand.trim();
    if (isNegotiable !== undefined) product.isNegotiable = isNegotiable;
    if (status && ['active', 'sold', 'reserved', 'inactive'].includes(status)) {
      product.status = status;
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// @desc    Delete a product listing (Seller only)
// @route   DELETE /api/products/:id
// @access  Private
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found with this ID'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Ownership Authorization Check
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this product'
      });
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};
