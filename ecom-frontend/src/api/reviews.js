import API from "../axios";

// GET: { average, count, reviews: [{ id, userName, rating, comment, createdAt }] }
export const fetchReviews = async (productId) => (await API.get(`/reviews/product/${productId}`)).data;

export const addReview = async (review) => (await API.post(`/reviews`, review)).data;

export const deleteReview = (id) => API.delete(`/reviews/${id}`);
