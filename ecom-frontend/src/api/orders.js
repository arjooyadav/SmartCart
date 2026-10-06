import API from "../axios";

// Records a completed order so admins can see who bought what.
// If the backend doesn't have the /orders endpoint yet, this fails silently —
// the sale still goes through (stock is already reduced by Cart.jsx), it just
// won't show up on the admin Orders page until the backend is updated.
export const placeOrder = (order) => API.post("/orders", order).catch(() => null);

// Admin only: every order, newest first.
export const fetchAllOrders = async () => (await API.get("/orders")).data;
