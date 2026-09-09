import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      minlength: [3, 'Product title must be at least 3 characters']
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    categorySlug: {
      type: String,
      trim: true
    },
    images: {
      type: [String],
      default: []
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'
    },
    askingPrice: {
      type: Number,
      required: [true, 'Asking price is required'],
      min: [1, 'Asking price must be greater than 0']
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative']
    },
    // SECURITY CRITICAL: select: false ensures minimumPrice is never returned
    // in public queries or detail queries unless explicitly requested by the seller.
    minimumPrice: {
      type: Number,
      required: [true, 'Minimum price is required'],
      min: [1, 'Minimum price must be greater than 0'],
      select: false
    },
    condition: {
      type: String,
      enum: ['Brand New', 'Like New', 'Excellent', 'Good', 'Fair', 'Refurbished'],
      default: 'Good'
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller reference is required']
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      default: 'India'
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'reserved', 'inactive'],
      default: 'active'
    },
    isNegotiable: {
      type: Boolean,
      default: true
    },
    brand: {
      type: String,
      trim: true
    },
    viewsCount: {
      type: Number,
      default: 0
    },
    featured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Virtual for primary image fallback
productSchema.pre('save', function (next) {
  if (this.images && this.images.length > 0 && !this.image) {
    this.image = this.images[0];
  } else if (this.image && (!this.images || this.images.length === 0)) {
    this.images = [this.image];
  }
  if (this.category && !this.categorySlug) {
    this.categorySlug = this.category.toLowerCase().replace(/\s+/g, '-');
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;
