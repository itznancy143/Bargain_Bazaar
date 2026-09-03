import { MOCK_PRODUCTS } from '../data/mockProducts';
import { CATEGORIES } from '../data/categories';

/**
 * Product Service Layer
 * Structured for seamless replacement with Axios / Fetch calls to Express backend
 */
export const productService = {
  // Get all active products with optional filters
  async getProducts({ category, search, minPrice, maxPrice, condition, location, sortBy } = {}) {
    // Simulate network latency (200ms)
    await new Promise((resolve) => setTimeout(resolve, 200));

    let results = [...MOCK_PRODUCTS];

    if (category && category !== 'all') {
      results = results.filter(
        (p) => p.categorySlug.toLowerCase() === category.toLowerCase() || p.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q)
      );
    }

    if (condition && condition !== 'all') {
      results = results.filter((p) => p.condition.toLowerCase() === condition.toLowerCase());
    }

    if (location && location !== 'all') {
      results = results.filter((p) => p.location.toLowerCase().includes(location.toLowerCase()));
    }

    if (minPrice !== undefined && minPrice !== '') {
      results = results.filter((p) => p.askingPrice >= Number(minPrice));
    }

    if (maxPrice !== undefined && maxPrice !== '') {
      results = results.filter((p) => p.askingPrice <= Number(maxPrice));
    }

    if (sortBy === 'price-low') {
      results.sort((a, b) => a.askingPrice - b.askingPrice);
    } else if (sortBy === 'price-high') {
      results.sort((a, b) => b.askingPrice - a.askingPrice);
    } else if (sortBy === 'newest') {
      results.sort((a, b) => new Date(b.dateListed) - new Date(a.dateListed));
    } else {
      // Default: recommended / featured first
      results.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return results;
  },

  // Get featured products for homepage
  async getFeaturedProducts(limit = 8) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return MOCK_PRODUCTS.filter((p) => p.featured).slice(0, limit);
  },

  // Get single product details by ID
  async getProductById(id) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const product = MOCK_PRODUCTS.find((p) => p.id === id);
    if (!product) throw new Error('Product not found');
    return product;
  },

  // Get all categories
  async getCategories() {
    return CATEGORIES;
  }
};
