import { apiFetch } from './api.js';
import { MOCK_PRODUCTS } from '../data/mockProducts';
import { CATEGORIES } from '../data/categories';

/**
 * Helper to normalize MongoDB products or mock products for UI consistency
 */
const normalizeProduct = (p) => {
  if (!p) return null;
  const id = p._id || p.id;
  const image = p.image || (p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80');
  const images = p.images && p.images.length > 0 ? p.images : [image];

  return {
    ...p,
    id,
    _id: id,
    image,
    images,
    gallery: p.gallery || images,
    categorySlug: p.categorySlug || (p.category ? p.category.toLowerCase().replace(/\s+/g, '-') : 'other')
  };
};

/**
 * Product Service Layer
 * Connects directly to Node/Express backend at http://localhost:5001/api/products
 * with mock fallback for initial demonstration catalogs.
 */
export const productService = {
  /**
   * Get all active products with filters and search
   */
  async getProducts({ category, search, minPrice, maxPrice, condition, location, sortBy } = {}) {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search && search.trim() !== '') params.append('search', search.trim());
    if (condition && condition !== 'all') params.append('condition', condition);
    if (location && location !== 'all') params.append('location', location.trim());
    if (minPrice !== undefined && minPrice !== '') params.append('minPrice', minPrice);
    if (maxPrice !== undefined && maxPrice !== '') params.append('maxPrice', maxPrice);
    if (sortBy) params.append('sortBy', sortBy);

    try {
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const data = await apiFetch(`/api/products${queryString}`, { method: 'GET' });

      if (data && data.success && Array.isArray(data.products)) {
        const backendProducts = data.products.map(normalizeProduct);

        // If backend has newly created products, combine with mock catalog or display backend list
        if (backendProducts.length > 0) {
          return backendProducts;
        }
      }
    } catch (err) {
      console.warn('Backend products query notice, using local catalog fallback:', err.message);
    }

    // Fallback filter over mock products if backend has no items yet
    let results = [...MOCK_PRODUCTS];

    if (category && category !== 'all') {
      results = results.filter(
        (p) =>
          p.categorySlug?.toLowerCase() === category.toLowerCase() ||
          p.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q)
      );
    }

    if (condition && condition !== 'all') {
      results = results.filter((p) => p.condition?.toLowerCase() === condition.toLowerCase());
    }

    if (location && location !== 'all') {
      results = results.filter((p) => p.location?.toLowerCase().includes(location.toLowerCase()));
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
      results.sort((a, b) => new Date(b.dateListed || b.createdAt) - new Date(a.dateListed || a.createdAt));
    } else {
      results.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return results.map(normalizeProduct);
  },

  /**
   * Get single product details by ID
   */
  async getProductById(id) {
    if (!id) throw new Error('Product ID is required');

    try {
      const data = await apiFetch(`/api/products/${id}`, { method: 'GET' });
      if (data && data.success && data.product) {
        return {
          ...normalizeProduct(data.product),
          isOwner: !!data.isOwner
        };
      }
    } catch (err) {
      // If error or mock id requested, fallback to mock products
    }

    const mock = MOCK_PRODUCTS.find((p) => p.id === id || p._id === id);
    if (mock) return normalizeProduct(mock);

    throw new Error('Product not found');
  },

  /**
   * Create a new product listing (Seller only)
   */
  async createProduct(productData) {
    const data = await apiFetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
    return data;
  },

  /**
   * Get all products owned by the authenticated seller
   */
  async getMyProducts() {
    const data = await apiFetch('/api/products/my-products', {
      method: 'GET'
    });
    if (data && data.success && Array.isArray(data.products)) {
      return data.products.map(normalizeProduct);
    }
    return [];
  },

  /**
   * Update an existing product (Seller only)
   */
  async updateProduct(id, productData) {
    const data = await apiFetch(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
    return data;
  },

  /**
   * Delete a product listing (Seller only)
   */
  async deleteProduct(id) {
    const data = await apiFetch(`/api/products/${id}`, {
      method: 'DELETE'
    });
    return data;
  },

  /**
   * Get all categories
   */
  async getCategories() {
    return CATEGORIES;
  }
};

export default productService;
