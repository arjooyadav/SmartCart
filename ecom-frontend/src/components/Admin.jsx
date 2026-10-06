import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppContext from "../Context/Context";
import { useToast } from "../Context/ToastContext";
import { CATEGORIES, LOW_STOCK, MAX_DISCOUNT, discountedPrice, formatPrice } from "../config";
import { SAMPLE_PRODUCTS } from "../data/sampleProducts";
import { deleteProduct, productImageUrl, seedSampleProducts, updateProduct } from "../api/products";

const stockState = (p) => {
  if (!p.productAvailable || p.stockQuantity <= 0) return { label: "Out of stock", cls: "bad" };
  if (p.stockQuantity <= LOW_STOCK) return { label: "Low stock", cls: "warn" };
  return { label: "In stock", cls: "ok" };
};

const Row = ({ product, imageVersion, busy, onSaveStock, onSaveDiscount, onToggle, onDelete }) => {
  const [stock, setStock] = useState(product.stockQuantity);
  const [discount, setDiscount] = useState(Number(product.discountPercent) || 0);
  const stockDirty = Number(stock) !== product.stockQuantity;
  const discountDirty = Number(discount) !== (Number(product.discountPercent) || 0);
  const st = stockState(product);

  const change = (delta) => setStock((s) => Math.max(0, (Number(s) || 0) + delta));
  const save = () => onSaveStock(product, Math.max(0, parseInt(stock, 10) || 0));
  const saveDiscount = () => onSaveDiscount(product, Math.min(MAX_DISCOUNT, Math.max(0, parseInt(discount, 10) || 0)));

  return (
    <tr>
      <td>
        <div className="row-product">
          <img src={productImageUrl(product.id, imageVersion)} alt="" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
          <div>
            <Link to={`/product/${product.id}`}><strong>{product.name}</strong></Link>
            <small className="muted">{product.brand}</small>
          </div>
        </div>
      </td>
      <td>{product.category}</td>
      <td>
        {Number(product.discountPercent) > 0 ? (
          <div className="price-row">
            <strong>{formatPrice(discountedPrice(product))}</strong>
            <span className="price-was">{formatPrice(product.price)}</span>
          </div>
        ) : (
          formatPrice(product.price)
        )}
      </td>
      <td>
        <div className="stepper" aria-label={`Stock for ${product.name}`}>
          <button onClick={() => change(-1)} aria-label="Decrease stock" disabled={busy}><i className="bi bi-dash" /></button>
          <input
            type="number" min="0" value={stock}
            onChange={(e) => setStock(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && stockDirty && save()}
            disabled={busy}
          />
          <button onClick={() => change(1)} aria-label="Increase stock" disabled={busy}><i className="bi bi-plus" /></button>
          {stockDirty && <button className="btn btn-primary btn-sm" onClick={save} disabled={busy}>Save</button>}
        </div>
      </td>
      <td>
        <div className="stepper" aria-label={`Discount for ${product.name}`}>
          <input
            type="number" min="0" max={MAX_DISCOUNT} value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && discountDirty && saveDiscount()}
            disabled={busy}
          />
          <span className="muted">%</span>
          {discountDirty && <button className="btn btn-primary btn-sm" onClick={saveDiscount} disabled={busy}>Save</button>}
        </div>
      </td>
      <td>
        <span className={`pill ${st.cls}`}>{st.label}</span>
      </td>
      <td>
        <label className="switch" title="Show this product as available to shoppers">
          <input type="checkbox" checked={product.productAvailable} disabled={busy} onChange={() => onToggle(product)} />
          <span />
        </label>
      </td>
      <td className="actions">
        <Link className="icon-btn" to={`/product/update/${product.id}`} aria-label={`Edit ${product.name}`}><i className="bi bi-pencil" /></Link>
        <button className="icon-btn danger" onClick={() => onDelete(product)} aria-label={`Delete ${product.name}`} disabled={busy}><i className="bi bi-trash3" /></button>
      </td>
    </tr>
  );
};

const Admin = () => {
  const { data, isLoading, isError, refreshData, removeFromCart, imageVersion } = useContext(AppContext);
  const toast = useToast();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const stats = useMemo(() => ({
    total: data.length,
    low: data.filter((p) => p.productAvailable && p.stockQuantity > 0 && p.stockQuantity <= LOW_STOCK).length,
    out: data.filter((p) => !p.productAvailable || p.stockQuantity <= 0).length,
    value: data.reduce((sum, p) => sum + p.price * Math.max(0, p.stockQuantity), 0),
  }), [data]);

  const rows = useMemo(() => data.filter((p) => {
    const text = `${p.name} ${p.brand} ${p.category}`.toLowerCase();
    if (q && !text.includes(q.toLowerCase())) return false;
    if (category && p.category?.toLowerCase() !== category.toLowerCase()) return false;
    if (stockFilter === "low" && !(p.productAvailable && p.stockQuantity > 0 && p.stockQuantity <= LOW_STOCK)) return false;
    if (stockFilter === "out" && !(!p.productAvailable || p.stockQuantity <= 0)) return false;
    return true;
  }), [data, q, category, stockFilter]);

  const run = async (product, action, successMessage) => {
    setBusyId(product.id);
    try {
      await action();
      await refreshData();
      toast(successMessage);
    } catch (err) {
      console.error(err);
      toast("Couldn’t save the change. Check that the backend is running.", "error");
    } finally {
      setBusyId(null);
    }
  };

  // Changing stock also flips availability: 0 units = unavailable, more than 0 = available again.
  const saveStock = (p, n) =>
    run(p, () => updateProduct(p, { stockQuantity: n, productAvailable: n > 0 }), `${p.name}: stock set to ${n}`);

  const saveDiscount = (p, n) =>
    run(p, () => updateProduct(p, { discountPercent: n }), n > 0 ? `${p.name}: ${n}% discount applied` : `${p.name}: discount removed`);

  const toggle = (p) =>
    run(p, () => updateProduct(p, { productAvailable: !p.productAvailable }),
      `${p.name} is now ${p.productAvailable ? "unavailable" : "available"}`);

  const remove = (p) => {
    if (!window.confirm(`Delete “${p.name}”? This can’t be undone.`)) return;
    run(p, async () => { await deleteProduct(p.id); removeFromCart(p.id); }, `${p.name} deleted`);
  };

  const seed = async () => {
    setSeeding(true);
    try {
      await seedSampleProducts();
      await refreshData();
      toast("Sample products added");
    } catch (err) {
      console.error(err);
      toast("Couldn’t add sample products. Is the backend running?", "error");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="page">
      <div className="section-head">
        <div>
          <h1 className="page-title">Product dashboard</h1>
          <p className="muted">Update stock, availability and details. Shoppers see changes straight away.</p>
        </div>
        <div className="row gap">
          <Link to="/admin/orders" className="btn btn-ghost"><i className="bi bi-receipt" /> Orders</Link>
          <Link to="/add_product" className="btn btn-primary"><i className="bi bi-plus-lg" /> Add product</Link>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><small>Products</small><strong>{stats.total}</strong></div>
        <div className={`stat ${stats.low ? "warn" : ""}`}><small>Low stock (≤ {LOW_STOCK})</small><strong>{stats.low}</strong></div>
        <div className={`stat ${stats.out ? "bad" : ""}`}><small>Out of stock</small><strong>{stats.out}</strong></div>
        <div className="stat"><small>Stock value</small><strong>{formatPrice(stats.value)}</strong></div>
      </div>

      {isError ? (
        <div className="state-box">
          <i className="bi bi-plug" />
          <h2>Can’t reach the backend</h2>
          <p>{isError}. Start the Spring Boot app on port 8080, then try again.</p>
          <button className="btn btn-primary" onClick={refreshData}>Try again</button>
        </div>
      ) : isLoading ? (
        <div className="skeleton tall" />
      ) : data.length === 0 ? (
        <div className="state-box">
          <i className="bi bi-box-seam" />
          <h2>No products yet</h2>
          <p>Add your first product, or load a starter catalogue of {SAMPLE_PRODUCTS.length} sample products to see how the store looks.</p>
          <div className="row gap">
            <Link to="/add_product" className="btn btn-primary">Add a product</Link>
            <button className="btn btn-ghost" onClick={seed} disabled={seeding}>
              {seeding ? "Adding samples…" : "Load sample products"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <div className="search wide">
              <i className="bi bi-search" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, brand or category" aria-label="Filter products" />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} aria-label="Stock level">
              <option value="">Any stock level</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Discount</th><th>Status</th><th>Available</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <Row
                    key={`${p.id}-${p.stockQuantity}`}
                    product={p}
                    imageVersion={imageVersion}
                    busy={busyId === p.id}
                    onSaveStock={saveStock}
                    onSaveDiscount={saveDiscount}
                    onToggle={toggle}
                    onDelete={remove}
                  />
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan="8" className="muted center pad">No products match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Admin;
