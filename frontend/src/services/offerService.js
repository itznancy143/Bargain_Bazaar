export const offerService = {
  async makeOffer(productId, amount, message = '') {
    return {
      id: 'offer_' + Date.now(),
      productId,
      amount: Number(amount),
      message,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
  },
  async getOffersForProduct(productId) {
    return [];
  }
};

export const orderService = {
  async getOrders() {
    return [];
  }
};

export const messageService = {
  async getConversations() {
    return [];
  }
};
