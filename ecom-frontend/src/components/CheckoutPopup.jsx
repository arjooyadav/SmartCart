import { useEffect } from "react";
import { discountedPrice, formatPrice } from "../config";
import { productImageUrl } from "../api/products";

const CheckoutPopup = ({ show, handleClose, cartItems, totalPrice, handleCheckout, busy, imageVersion }) => {
  useEffect(() => {
    if (!show) return;
    const onKey = (e) => e.key === "Escape" && !busy && handleClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [show, busy, handleClose]);

  if (!show) return null;

  return (
    <div className="modal-backdrop" onMouseDown={() => !busy && handleClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title" onMouseDown={(e) => e.stopPropagation()}>
        <h2 id="checkout-title">Confirm your order</h2>
        <ul className="modal-list">
          {cartItems.map((item) => (
            <li key={item.id}>
              <img src={productImageUrl(item.id, imageVersion)} alt="" />
              <div>
                <strong>{item.name}</strong>
                <small className="muted">Qty {item.quantity}</small>
              </div>
              <span>{formatPrice(discountedPrice(item) * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="modal-total"><span>Total</span><strong>{formatPrice(totalPrice)}</strong></div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={handleClose} disabled={busy}>Keep shopping</button>
          <button className="btn btn-primary" onClick={handleCheckout} disabled={busy}>
            {busy ? "Placing order…" : "Place order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPopup;
