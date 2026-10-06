import { Link } from "react-router-dom";
import { productImageUrl } from "../api/products";
import { discountedPrice, formatPrice, LOW_STOCK } from "../config";
import { useAuth } from "../Context/AuthContext";

const ProductCard = ({ product, imageVersion, onAdd }) => {
  const { isAdmin } = useAuth();
  const { id, name, brand, category, price, stockQuantity, productAvailable, description, demo } = product;
  const soldOut = !productAvailable || stockQuantity <= 0;
  const low = !soldOut && stockQuantity <= LOW_STOCK;
  const src = demo ? product.image : productImageUrl(id, imageVersion);
  const discount = Number(product.discountPercent) || 0;
  const finalPrice = discountedPrice(product);

  const body = (
    <>
      <div className="thumb">
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
        />
        <span className="tag">{category}</span>
        {discount > 0 && !soldOut && <span className="discount-badge">{discount}% off</span>}
        {soldOut && <span className="stamp">Sold out</span>}

        {/* Hover / focus preview — only kicks in on devices with a real pointer (see styles.css) */}
        <div className="hover-preview">
          <strong>{name}</strong>
          <span className="muted">{brand} · {category}</span>
          {description && <p>{description}</p>}
          <div className="hover-preview-price">
            {discount > 0 ? (
              <>
                <span className="was">{formatPrice(price)}</span>
                <strong>{formatPrice(finalPrice)}</strong>
              </>
            ) : (
              <strong>{formatPrice(price)}</strong>
            )}
          </div>
          <span className={soldOut ? "bad" : low ? "warn" : "ok"}>
            {soldOut ? "Out of stock" : low ? `Only ${stockQuantity} left` : `${stockQuantity} in stock`}
          </span>
        </div>
      </div>
      <div className="card-body">
        <h3>{name}</h3>
        <p className="muted">{brand}</p>
      </div>
    </>
  );

  return (
    <article className={`product-card ${soldOut ? "is-soldout" : ""}`} tabIndex={demo ? -1 : 0}>
      {demo ? <div className="card-link">{body}</div> : <Link className="card-link" to={`/product/${id}`}>{body}</Link>}
      <div className="card-foot">
        <div>
          {discount > 0 ? (
            <div className="price-row">
              <strong className="price">{formatPrice(finalPrice)}</strong>
              <span className="price-was">{formatPrice(price)}</span>
            </div>
          ) : (
            <strong className="price">{formatPrice(price)}</strong>
          )}
          {low && <small className="warn">Only {stockQuantity} left</small>}
        </div>
        <button
          className="btn btn-primary btn-sm"
          disabled={soldOut || demo || isAdmin}
          title={isAdmin ? "Admin accounts can't buy products" : undefined}
          onClick={() => onAdd(product)}
        >
          {isAdmin ? "Admin view" : soldOut ? "Sold out" : demo ? "Sample" : "Add to cart"}
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
