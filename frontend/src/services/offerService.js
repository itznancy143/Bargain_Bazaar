import { apiFetch } from './api.js';

/**
 * Offer & Bargaining Service Client
 * Handles real-time negotiation REST calls to Node/Express backend at /api/offers
 */
export const offerService = {
  /**
   * Create a new bargain offer on a product listing
   * @param {Object} data - { productId, amount, message }
   */
  async createOffer({ productId, amount, message }) {
    const data = await apiFetch('/api/offers', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        amount: Number(amount),
        message: message ? message.trim() : ''
      })
    });
    return data;
  },

  /**
   * Get all offers involving the current user (sent as buyer or received as seller)
   * @param {Object} params - { role: 'buyer'|'seller'|'all', status }
   */
  async getMyOffers({ role, status } = {}) {
    const query = new URLSearchParams();
    if (role && role !== 'all') query.append('role', role);
    if (status && status !== 'all') query.append('status', status);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const data = await apiFetch(`/api/offers/my${qs}`, {
      method: 'GET'
    });
    return data.offers || [];
  },

  /**
   * Check if the authenticated user already has an active offer on a product
   * @param {string} productId
   */
  async getOfferByProduct(productId) {
    if (!productId) return null;
    try {
      const data = await apiFetch(`/api/offers/product/${productId}`, {
        method: 'GET'
      });
      return data.offer || null;
    } catch {
      return null;
    }
  },

  /**
   * Get complete negotiation details by offer ID
   * @param {string} offerId
   */
  async getOfferById(offerId) {
    if (!offerId) throw new Error('Offer ID is required');
    const data = await apiFetch(`/api/offers/${offerId}`, {
      method: 'GET'
    });
    return data;
  },

  /**
  * Accept an active offer / counteroffer (await seller confirmation)
   * @param {string} offerId
   * @param {string} message
   */
  async acceptOffer(offerId, message = '') {
    const data = await apiFetch(`/api/offers/${offerId}/accept`, {
      method: 'PUT',
      body: JSON.stringify({ message })
    });
    return data;
  },

  /**
   * Confirm a negotiated deal as the product seller
   * @param {string} offerId
   */
  async confirmDeal(offerId) {
    const data = await apiFetch(`/api/offers/${offerId}/confirm-deal`, {
      method: 'PUT'
    });
    return data;
  },

  /**
   * Reject an active offer / counteroffer
   * @param {string} offerId
   * @param {string} message
   */
  async rejectOffer(offerId, message = '') {
    const data = await apiFetch(`/api/offers/${offerId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ message })
    });
    return data;
  },

  /**
   * Make a counteroffer
   * @param {string} offerId
   * @param {Object} data - { amount, message }
   */
  async counterOffer(offerId, { amount, message }) {
    const data = await apiFetch(`/api/offers/${offerId}/counter`, {
      method: 'POST',
      body: JSON.stringify({
        amount: Number(amount),
        message: message ? message.trim() : ''
      })
    });
    return data;
  }
};

export default offerService;
