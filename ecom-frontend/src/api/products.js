import API from "../axios";
import { API_BASE, CATEGORY_SYNONYMS } from "../config";
import { SAMPLE_PRODUCTS } from "../data/sampleProducts";

export const productImageUrl = (id, version = 0) => `${API_BASE}/product/${id}/image?v=${version}`;

export const fetchProductById = async (id) => (await API.get(`/product/${id}`)).data;

const runSearch = (keyword) => API.get(`/products/search`, { params: { keyword } }).then((r) => r.data);

// Searches the typed keyword, plus the category it's a synonym for (see CATEGORY_SYNONYMS in config.js),
// so typing "phone" also finds products in the "Mobile" category even if no product mentions "phone".
export const searchProducts = async (keyword) => {
  const trimmed = keyword.trim();
  const lower = trimmed.toLowerCase();
  const terms = new Set([trimmed]);
  Object.entries(CATEGORY_SYNONYMS).forEach(([word, category]) => {
    if (lower.includes(word)) terms.add(category);
  });

  const results = await Promise.all([...terms].map((term) => runSearch(term).catch(() => [])));
  const merged = new Map();
  results.flat().forEach((p) => merged.set(p.id, p));
  return [...merged.values()];
};

// The backend returns the image bytes as base64 inside the product JSON – we never need to send that back.
const stripImageData = ({ imageData, ...rest }) => rest;

const toFormData = (product, imageFile) => {
  const fd = new FormData();
  fd.append("imageFile", imageFile);
  fd.append("product", new Blob([JSON.stringify(product)], { type: "application/json" }));
  return fd;
};

export const createProduct = (product, imageFile) => API.post("/product", toFormData(product, imageFile));

// Your PUT endpoint always expects an image, so when the admin only changes text/stock
// we download the current image and send it straight back.
const fetchCurrentImage = async (product) => {
  const res = await API.get(`/product/${product.id}/image`, { responseType: "blob" });
  return new File([res.data], product.imageName || "image", { type: res.data.type || product.imageType });
};

export const updateProduct = async (product, changes = {}, newImage = null) => {
  const merged = { ...stripImageData(product), ...changes };
  const image = newImage || (await fetchCurrentImage(product));
  return API.put(`/product/${product.id}`, toFormData(merged, image));
};

export const deleteProduct = (id) => API.delete(`/product/${id}`);

// Pushes the demo catalogue into the real database.
export const seedSampleProducts = async () => {
  for (const p of SAMPLE_PRODUCTS) {
    const { id, demo, svg, image, ...fields } = p;
    const file = new File([svg], `${fields.name.replace(/\s+/g, "-").toLowerCase()}.svg`, { type: "image/svg+xml" });
    await createProduct(fields, file);
  }
};
