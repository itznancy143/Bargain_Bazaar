import { apiFetch } from './api.js';

export const orderService = {
  async getMyOrders() {
    const data = await apiFetch('/api/orders/my-orders');
    return data.orders || [];
  },

  async getSellerOrders() {
    const data = await apiFetch('/api/orders/seller-orders');
    return data.orders || [];
  },

  async getOrderById(orderId) {
    const data = await apiFetch(`/api/orders/${orderId}`);
    return data.order;
  }
};

export default orderService;