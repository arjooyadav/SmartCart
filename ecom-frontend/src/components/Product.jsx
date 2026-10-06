import { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppContext from "../Context/Context";
import { useAuth } from "../Context/AuthContext";
import { useToast } from "../Context/ToastContext";
import { deleteProduct, fetchProductById, productImageUrl } from "../api/products";
import { LOW_STOCK, discountedPrice, formatPrice } from "../config";
import ReviewSection from "./ReviewSection";
import RelatedProducts from "./RelatedProducts";

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAdmin } = useAuth();
  const { addToCart, removeFromCart, refreshData, imageVersion } = useContext(AppContext);
  const [product, setProduct] = useState(null);
  const [failed, setFailed] = useState(false);
  const ZOOM = 2.2; // how much the floating panel magnifies the image
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [lensBox, setLensBox] = useState({ left: 0, top: 0 });
  const [zooming, setZooming] = useState(false);
  const imageWrapRef = useRef(null);

  const handleImageMove = (e) => {
    const rect = imageWrapRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });

    // The small square on the thumbnail that shows which part is being magnified —
    // sized to match what the floating panel is actually showing, clamped to stay inside the image.
    const lensSize = 100 / ZOOM;
    setLensBox({
      left: Math.min(100 - lensSize, Math.max(0, x - lensSize / 2)),
      top: Math.min(100 - lensSize, Math.max(0, y - lensSize / 2)),
    });
  };

  useEffect(() => {
    setProduct(null);
    setFailed(false);
    fetchProductById(id).then(setProduct).catch(() => setFailed(true));
  }, [id]);

  const remove = async () => {
    if (!window.confirm(`Delete “${product.name}”? This can’t be undone.`)) return;
    try {
      await deleteProduct(id);
      removeFromCart(id);
      await refreshData();
      toast(`${product.name} deleted`);
      navigate("/admin");
    } catch {
      toast("Couldn’t delete the product.", "error");
    }
  };

  const add = () => {
    const res = addToCart(product);
    toast(res.message, res.ok ? "success" : "error");
  };

  if (failed) {
    return (
      <div className="page narrow state-box">
        <i className="bi bi-search" />
        <h2>We couldn’t find that product</h2>
        <p>It may have been removed.</p>
        <Link className="btn btn-primary" to="/">Back to shop</Link>
      </div>
    );
  }
  if (!product) return <div className="page"><div className="skeleton tall" /></div>;

  const soldOut = !product.productAvailable || product.stockQuantity <= 0;
  const low = !soldOut && product.stockQuantity <= LOW_STOCK;
  const discount = Number(product.discountPercent) || 0;
  const finalPrice = discountedPrice(product);

  return (
    <div className="page">
      <Link to="/" className="back"><i className="bi bi-arrow-left" /> All products</Link>

      <div className="detail">
        <div className="detail-image-wrap">
          <div
            className={`detail-image ${zooming ? "is-zooming" : ""}`}
            ref={imageWrapRef}
            onMouseEnter={() => setZooming(true)}
            onMouseLeave={() => setZooming(false)}
            onMouseMove={handleImageMove}
          >
            <img src={productImageUrl(id, imageVersion)} alt={product.name} onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
            {zooming && (
              <div className="lens-box" style={{ left: `${lensBox.left}%`, top: `${lensBox.top}%`, width: `${100 / ZOOM}%`, height: `${100 / ZOOM}%` }} />
            )}
            <span className="zoom-hint"><i className="bi bi-zoom-in" /> Hover to zoom</span>
          </div>

          {/* The magnified view renders outside the thumbnail, in its own floating panel —
              not drawn over the original image. */}
          {zooming && (
            <div
              className="zoom-pane"
              style={{
                backgroundImage: `url(${productImageUrl(id, imageVersion)})`,
                backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                backgroundSize: `${ZOOM * 100}%`,
              }}
              aria-hidden
            />
          )}
        </div>

        <div className="detail-info">
          <span className="tag inline">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="muted">by {product.brand}</p>

          {discount > 0 ? (
            <div className="detail-price-row">
              <strong className="detail-price">{formatPrice(finalPrice)}</strong>
              <span className="price-was">{formatPrice(product.price)}</span>
              <span className="discount-badge inline">{discount}% off</span>
            </div>
          ) : (
            <strong className="detail-price">{formatPrice(product.price)}</strong>
          )}

          <p className={`stock-line ${soldOut ? "bad" : low ? "warn" : "ok"}`}>
            <i className={`bi ${soldOut ? "bi-x-circle" : "bi-check-circle"}`} />
            {soldOut ? "Out of stock" : low ? `Only ${product.stockQuantity} left` : `In stock (${product.stockQuantity} available)`}
          </p>

          <p className="detail-desc">{product.description}</p>

          <div className="row gap">
            <button className="btn btn-primary btn-lg" onClick={add} disabled={soldOut || isAdmin} title={isAdmin ? "Admin accounts can't buy products" : undefined}>
              {isAdmin ? "Admin view" : soldOut ? "Sold out" : "Add to cart"}
            </button>
            {isAdmin && <p className="muted small">Sign in as a shopper to buy this product.</p>}
          </div>

          {product.releaseDate && (
            <p className="muted small">Listed on {new Date(product.releaseDate).toLocaleDateString()}</p>
          )}

          {isAdmin && (
            <div className="admin-box">
              <strong>Admin</strong>
              <div className="row gap">
                <Link className="btn btn-ghost btn-sm" to={`/product/update/${id}`}><i className="bi bi-pencil" /> Edit</Link>
                <button className="btn btn-danger btn-sm" onClick={remove}><i className="bi bi-trash3" /> Delete</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ReviewSection productId={id} />
      <RelatedProducts productId={id} />
    </div>
  );
};

export default Product;
