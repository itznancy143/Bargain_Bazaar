import { apiFetch, resolveImageUrl } from './api.js';

export const reviewService = {
  /**
   * Submit a new review for a delivered order with optional photo uploads
   * @param {Object|FormData} data - { orderId, rating, comment, photos } or FormData instance
   */
  async createReview(data) {
    let body;

    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      body = data;
    } else if (data && data.photos && Array.isArray(data.photos) && data.photos.length > 0) {
      const formData = new FormData();
      formData.append('orderId', data.orderId);
      formData.append('rating', data.rating);
      if (data.comment) formData.append('comment', data.comment);

      data.photos.forEach((photo) => {
        if (photo instanceof File || photo instanceof Blob) {
          formData.append('photos', photo);
        }
      });
      body = formData;
    } else {
      const formData = new FormData();
      formData.append('orderId', data.orderId);
      formData.append('rating', data.rating);
      if (data.comment) formData.append('comment', data.comment);
      body = formData;
    }

    const response = await apiFetch('/api/reviews', {
      method: 'POST',
      body
    });
    return response;
  },

  /**
   * Get all reviews and rating breakdown for a product
   * @param {string} productId
   */
  async getProductReviews(productId) {
    const response = await apiFetch(`/api/reviews/product/${productId}`);
    return response;
  },

  /**
   * Get existing review for a specific order
   * @param {string} orderId
   */
  async getOrderReview(orderId) {
    const response = await apiFetch(`/api/reviews/order/${orderId}`);
    return response.review;
  },

  /**
   * Get all reviews for a seller
   * @param {string} sellerId
   */
  async getSellerReviews(sellerId) {
    const response = await apiFetch(`/api/reviews/seller/${sellerId}`);
    return response;
  },

  /**
   * Update an existing review (Buyer author only)
   * @param {string} reviewId
   * @param {Object} data - { rating, comment }
   */
  async updateReview(reviewId, data) {
    const response = await apiFetch(`/api/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response;
  },

  /**
   * Delete an existing review
   * @param {string} reviewId
   */
  async deleteReview(reviewId) {
    const response = await apiFetch(`/api/reviews/${reviewId}`, {
      method: 'DELETE'
    });
    return response;
  },

  /**
   * Helper to get displayable image URL
   */
  resolveImageUrl(url) {
    return resolveImageUrl(url);
  }
};

export default reviewService;
