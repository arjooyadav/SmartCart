import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppContext from "../Context/Context";
import { useAuth } from "../Context/AuthContext";
import { useToast } from "../Context/ToastContext";
import { CATEGORIES, HERO_IMAGE, discountedPrice, formatPrice } from "../config";
import { SAMPLE_PRODUCTS } from "../data/sampleProducts";
import { productImageUrl } from "../api/products";
import ProductCard from "./ProductCard";

const Home = ({ selectedCategory, onSelectCategory }) => {
  const { data, isError, isLoading, addToCart, imageVersion } = useContext(AppContext);
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [sort, setSort] = useState("featured");

  // While the backend has nothing to show, fall back to the sample catalogue so the page is never empty.
  const usingSamples = !isLoading && (isError || data.length === 0);
  const products = usingSamples ? SAMPLE_PRODUCTS : data;

  const visible = useMemo(() => {
    let list = selectedCategory
      ? products.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase())
      : [...products];
    if (sort === "low") list.sort((a, b) => discountedPrice(a) - discountedPrice(b));
    if (sort === "high") list.sort((a, b) => discountedPrice(b) - discountedPrice(a));
    if (sort === "discount") list.sort((a, b) => (Number(b.discountPercent) || 0) - (Number(a.discountPercent) || 0));
    return list;
  }, [products, selectedCategory, sort]);

  // Prefer showing off a product that has a discount right now.
  const inStock = products.filter((p) => p.productAvailable && p.stockQuantity > 0);
  const featured = inStock.find((p) => Number(p.discountPercent) > 0) || inStock[0];

  const handleAdd = (product) => {
    const res = addToCart(product);
    toast(res.message, res.ok ? "success" : "error");
  };

  return (
    <>
      <section className="hero" style={{ "--hero-image": `url(${HERO_IMAGE})` }}>
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>Tech, style and toys. Only what’s in stock.</h1>
            <p>
              Browse laptops, headphones, phones and more. Stock is updated the moment an order is placed,
              so if you can add it to your cart, we can ship it.
            </p>
            <div className="hero-actions">
              <a href="#products" className="btn btn-primary btn-lg">Shop products</a>
              {!user && <Link to="/login" className="btn btn-ghost btn-lg">Sign in</Link>}
              {isAdmin && <Link to="/admin" className="btn btn-ghost btn-lg">Open dashboard</Link>}
            </div>
          </div>

          {featured && (
            <aside className="hero-feature">
              <img src={featured.demo ? featured.image : productImageUrl(featured.id, imageVersion)} alt="" />
              <div>
                <small>In stock now</small>
                <strong>{featured.name}</strong>
                <span>
                  {Number(featured.discountPercent) > 0 ? (
                    <>
                      <s className="was">{formatPrice(featured.price)}</s> {formatPrice(discountedPrice(featured))}
                    </>
                  ) : (
                    formatPrice(featured.price)
                  )}
                </span>
              </div>
            </aside>
          )}
        </div>
      </section>

      <main className="page" id="products">
        {usingSamples && (
          <div className="notice">
            <i className="bi bi-info-circle" />
            <div>
              <strong>{isError ? "Can’t reach the store server." : "The store has no products yet."}</strong>{" "}
              You’re looking at sample products.{" "}
              {isAdmin ? (
                <Link to="/admin">Add real products from the dashboard</Link>
              ) : (
                "Real products appear here as soon as an admin adds them."
              )}
              {isError && <small className="muted"> ({isError}. Is the Spring Boot app running on port 8080?)</small>}
            </div>
          </div>
        )}

        <div className="section-head">
          <h2>{selectedCategory || "All products"}</h2>
          <label className="sort">
            <span className="muted">Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="featured">Featured</option>
              <option value="discount">Biggest discount</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </label>
        </div>

        <div className="chips" role="tablist" aria-label="Filter by category">
          {["", ...CATEGORIES].map((c) => (
            <button key={c || "all"} className={`chip ${selectedCategory === c ? "active" : ""}`} onClick={() => onSelectCategory(c)}>
              {c || "All"}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="state-box">
            <i className="bi bi-box-seam" />
            <h2>Nothing in {selectedCategory} yet</h2>
            <p>Try another category or check back soon.</p>
            <button className="btn btn-primary" onClick={() => onSelectCategory("")}>Show all products</button>
          </div>
        ) : (
          <div className="grid">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} imageVersion={imageVersion} onAdd={handleAdd} />
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export default Home;
