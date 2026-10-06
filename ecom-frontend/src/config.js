// Central place for things you may want to change.
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
export const BRAND = "Troveo";

// Keep this list in sync with the categories you use in the backend.
export const CATEGORIES = ["Laptop", "Headphone", "Mobile", "Electronics", "Toys", "Fashion", "Shoes", "Fans"];

// Products with this many units (or fewer) are flagged "Low stock".
export const LOW_STOCK = 5;

// Highest discount an admin can set on a product, in percent.
export const MAX_DISCOUNT = 90;

// Background photo for the home page hero (falls back to a gradient if offline).
export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=2000&q=70";

export const formatPrice = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

// price after the product's discount is applied (discountPercent is 0-100)
export const discountedPrice = (product) => {
  const pct = Number(product?.discountPercent) || 0;
  const price = Number(product?.price) || 0;
  return pct > 0 ? Math.round(price * (1 - pct / 100)) : price;
};

// Words shoppers might type that should also match a category, so "phone" finds
// everything filed under the "Mobile" category, "earbuds" finds "Headphone", etc.
// Add more pairs here any time — the word on the left maps to a category on the right.
export const CATEGORY_SYNONYMS = {
  phone: "Mobile", phones: "Mobile", smartphone: "Mobile", smartphones: "Mobile", cellphone: "Mobile",
  laptop: "Laptop", laptops: "Laptop", notebook: "Laptop", notebooks: "Laptop", macbook: "Laptop",
  headphone: "Headphone", headphones: "Headphone", earphone: "Headphone", earphones: "Headphone",
  earbud: "Headphone", earbuds: "Headphone", headset: "Headphone",
  watch: "Electronics", watches: "Electronics", smartwatch: "Electronics", gadget: "Electronics", gadgets: "Electronics",
  toy: "Toys", kids: "Toys", children: "Toys",
  cloth: "Fashion", clothes: "Fashion", clothing: "Fashion", jacket: "Fashion", wear: "Fashion",
  shoe: "Shoes", sneaker: "Shoes", sneakers: "Shoes", footwear: "Shoes", trainers: "Shoes", boots: "Shoes",
  fan: "Fans", "ceiling fan": "Fans", "table fan": "Fans",
};
