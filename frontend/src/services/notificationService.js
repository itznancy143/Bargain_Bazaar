import { apiFetch } from './api.js';

export const notificationService = {
  /**
   * Fetch current user's notifications
   * @param {Object} [params] - { limit, page, unreadOnly }
   */
  async getMyNotifications(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit);
    if (params.page) query.append('page', params.page);
    if (params.unreadOnly !== undefined) query.append('unreadOnly', params.unreadOnly);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const data = await apiFetch(`/api/notifications${qs}`, {
      method: 'GET'
    });
    return data;
  },

  /**
   * Get total unread count for badge display
   */
  async getUnreadCount() {
    const data = await apiFetch('/api/notifications/unread-count', {
      method: 'GET'
    });
    return data.count || 0;
  },

  /**
   * Mark single notification as read
   * @param {string} notificationId
   */
  async markAsRead(notificationId) {
    if (!notificationId) return null;
    const data = await apiFetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
    return data;
  },

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead() {
    const data = await apiFetch('/api/notifications/read-all', {
      method: 'PUT'
    });
    return data;
  },

  /**
   * Delete a notification
   * @param {string} notificationId
   */
  async deleteNotification(notificationId) {
    if (!notificationId) return null;
    const data = await apiFetch(`/api/notifications/${notificationId}`, {
      method: 'DELETE'
    });
    return data;
  }
};

export default notificationService;
