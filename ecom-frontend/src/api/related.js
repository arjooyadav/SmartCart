import API from "../axios";

// "You might also like" — same brand/category plus sensible cross-sell categories
// (e.g. a phone suggests headphones), computed server-side from real catalogue data.
export const fetchRelatedProducts = async (productId) => (await API.get(`/products/${productId}/related`)).data;
