import { apiFetch } from './api.js';
import { CATEGORIES } from '../data/categories';

const PRODUCT_IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

const normalizeProduct = (p) => {
  if (!p) return null;
  const id = p._id || p.id;
  const image = p.image || (p.images && p.images.length > 0 ? p.images[0] : PRODUCT_IMAGE_FALLBACK);
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
 * Connects directly to the Node/Express product API. Product IDs must come
 * from MongoDB so they remain valid for offer and negotiation requests.
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

      if (data?.success && Array.isArray(data.products)) {
        return data.products.map(normalizeProduct);
      }
      throw new Error('The product service returned an invalid response.');
    } catch (err) {
      throw err;
    }
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
      throw new Error('Product not found.');
    } catch (err) {
      throw err;
    }
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
