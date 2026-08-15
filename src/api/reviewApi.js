import api from './axios';

export const reviewApi = {
  /**
   * Submit a customer review for an order.
   */
  submitReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  /**
   * Check if a review already exists for a given orderRef.
   */
  getReviewByOrderRef: async (orderRef) => {
    const response = await api.get(`/reviews/order/${orderRef}`);
    return response.data;
  },

  /**
   * Cleaner portal: fetch authenticated cleaner's customer reviews & rating analytics.
   */
  getProviderReviews: async (params = {}) => {
    const response = await api.get('/reviews/provider', { params });
    return response.data;
  },

  /**
   * Cleaner portal: reply to a customer review.
   */
  replyToReview: async (reviewId, text) => {
    const response = await api.post(`/reviews/${reviewId}/reply`, { text });
    return response.data;
  },

  /**
   * Public: fetch reviews for a given provider.
   */
  getPublicProviderReviews: async (providerId) => {
    const response = await api.get(`/reviews/public/${providerId}`);
    return response.data;
  },

  /**
   * Public: fetch cleaner rankings directory, overall rating, real comments & services offered.
   */
  getProviderDirectory: async (params = {}) => {
    const response = await api.get('/reviews/directory', { params });
    return response.data;
  }
};
