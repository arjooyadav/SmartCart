// Demo catalogue. Shown on the home page while the backend has no products,
// and can be pushed into the database from the Admin dashboard ("Load sample products").

const ICONS = {
  Laptop: "💻",
  Headphone: "🎧",
  Mobile: "📱",
  Electronics: "⌚",
  Toys: "🧸",
  Fashion: "🧥",
};

const makeSvg = (from, to, category) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">` +
  `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
  `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
  `<rect width="400" height="300" fill="url(#g)"/>` +
  `<circle cx="330" cy="50" r="90" fill="#fff" fill-opacity="0.10"/>` +
  `<circle cx="60" cy="280" r="110" fill="#fff" fill-opacity="0.08"/>` +
  `<text x="200" y="190" font-size="120" text-anchor="middle">${ICONS[category] || "📦"}</text></svg>`;

// [name, brand, category, price, stockQuantity, description, discountPercent, [gradientFrom, gradientTo]]
const raw = [
  ["Aero Book 14", "Novatech", "Laptop", 74999, 12, "Ultra-light 14-inch laptop with an all-day battery, 16 GB RAM and a 512 GB SSD.", 10, ["#1e3a8a", "#38bdf8"]],
  ["Studio Pro 16", "Novatech", "Laptop", 109999, 6, "16-inch creator laptop with a colour-accurate display and a dedicated graphics card.", 0, ["#111827", "#6366f1"]],
  ["SoundWave Over-Ear", "Auralux", "Headphone", 8999, 25, "Wireless over-ear headphones with active noise cancellation and 40 hours of playback.", 0, ["#7c2d12", "#fb923c"]],
  ["BassBuds X", "Auralux", "Headphone", 2499, 3, "Compact true-wireless earbuds with punchy bass and a pocket-sized charging case.", 15, ["#831843", "#f472b6"]],
  ["Nova 12 5G", "Zenfone", "Mobile", 29999, 18, "6.7-inch AMOLED phone with a 50 MP camera and 67 W fast charging.", 20, ["#064e3b", "#34d399"]],
  ["Orbit S Ultra", "Zenfone", "Mobile", 54999, 0, "Flagship phone with a periscope zoom lens. Currently sold out.", 0, ["#312e81", "#a78bfa"]],
  ["FitBand Watch 3", "Pulsar", "Electronics", 6999, 40, "Smartwatch with heart-rate tracking, GPS and a 10-day battery.", 0, ["#0f766e", "#5eead4"]],
  ["Castle Block Set", "Brickly", "Toys", 1899, 30, "600-piece castle building set for ages 8 and up.", 0, ["#b45309", "#fcd34d"]],
  ["Classic Denim Jacket", "Threadhouse", "Fashion", 2999, 15, "Mid-weight denim jacket with a relaxed fit and brass buttons.", 25, ["#1e293b", "#94a3b8"]],
];

const today = new Date().toISOString().slice(0, 10);

export const SAMPLE_PRODUCTS = raw.map(([name, brand, category, price, stockQuantity, description, discountPercent, [from, to]], i) => {
  const svg = makeSvg(from, to, category);
  return {
    id: `demo-${i + 1}`,
    name,
    brand,
    category,
    price,
    stockQuantity,
    description,
    discountPercent,
    releaseDate: today,
    productAvailable: stockQuantity > 0,
    demo: true,
    svg,
    image: "data:image/svg+xml;utf8," + encodeURIComponent(svg),
  };
});
