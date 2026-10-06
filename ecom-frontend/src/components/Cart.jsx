import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppContext from "../Context/Context";
import { useAuth } from "../Context/AuthContext";
import { useToast } from "../Context/ToastContext";
import { discountedPrice, formatPrice } from "../config";
import { productImageUrl, updateProduct } from "../api/products";
import { placeOrder } from "../api/orders";
import CheckoutPopup from "./CheckoutPopup";

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, refreshData, imageVersion } = useContext(AppContext);
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [busy, setBusy] = useState(false);

  // make sure stock and prices are current when the cart opens
  useEffect(() => { refreshData(); }, [refreshData]);

  const total = cartItems.reduce((sum, i) => sum + discountedPrice(i) * i.quantity, 0);
  const problem = cartItems.find((i) => i.quantity > i.stockQuantity || !i.productAvailable);

  const changeQty = (item, delta) => {
    const next = item.quantity + delta;
    if (next < 1) return;
    if (next > item.stockQuantity) return toast(`Only ${item.stockQuantity} in stock`, "error");
    updateQuantity(item.id, next);
  };

  // Checkout reduces the stock of each product, then records the order so admins can see it.
  const checkout = async () => {
    setBusy(true);
    try {
      for (const item of cartItems) {
        const left = item.stockQuantity - item.quantity;
        await updateProduct(item, { stockQuantity: left, productAvailable: left > 0 });
      }
      await placeOrder({
        userEmail: user.email,
        userName: user.name,
        totalAmount: total,
        items: cartItems.map((item) => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: discountedPrice(item),
        })),
      });
      clearCart();
      await refreshData();
      setShowModal(false);
      toast("Order placed. Thank you!");
    } catch (err) {
      console.error(err);
      toast("Something went wrong while placing your order.", "error");
      await refreshData();
    } finally {
      setBusy(false);
    }
  };

  // Admins manage the catalogue, they don't place orders through the storefront.
  if (isAdmin) {
    return (
      <div className="page narrow state-box">
        <i className="bi bi-shield-lock" />
        <h2>Admins can't buy products</h2>
        <p>Sign in with a shopper account to add products to a cart and check out.</p>
        <Link className="btn btn-primary" to="/admin/orders">View orders instead</Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="page narrow state-box">
        <i className="bi bi-bag" />
        <h2>Your cart is empty</h2>
        <p>Add something you like and it will show up here.</p>
        <Link className="btn btn-primary" to="/">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Your cart</h1>
      <div className="cart-layout">
        <ul className="cart-list">
          {cartItems.map((item) => (
            <li key={item.id} className="cart-row">
              <img src={productImageUrl(item.id, imageVersion)} alt="" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
              <div className="cart-info">
                <Link to={`/product/${item.id}`}><strong>{item.name}</strong></Link>
                <small className="muted">{item.brand}</small>
                {(item.quantity > item.stockQuantity || !item.productAvailable) && (
                  <small className="warn">Only {Math.max(item.stockQuantity, 0)} available — lower the quantity or remove it.</small>
                )}
              </div>
              <div className="stepper">
                <button onClick={() => changeQty(item, -1)} aria-label="Decrease quantity"><i className="bi bi-dash" /></button>
                <span className="qty">{item.quantity}</span>
                <button onClick={() => changeQty(item, 1)} aria-label="Increase quantity"><i className="bi bi-plus" /></button>
              </div>
              <strong className="line-total">{formatPrice(discountedPrice(item) * item.quantity)}</strong>
              <button className="icon-btn danger" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}>
                <i className="bi bi-trash3" />
              </button>
            </li>
          ))}
        </ul>

        <aside className="summary panel">
          <h2>Order summary</h2>
          <div className="sum-row"><span>Items</span><span>{cartItems.reduce((n, i) => n + i.quantity, 0)}</span></div>
          <div className="sum-row total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
          <button className="btn btn-primary btn-block" onClick={() => setShowModal(true)} disabled={!!problem}>
            Check out
          </button>
          {problem && <p className="form-error small">Fix the stock warning above to continue.</p>}
        </aside>
      </div>

      <CheckoutPopup
        show={showModal}
        handleClose={() => setShowModal(false)}
        cartItems={cartItems}
        totalPrice={total}
        handleCheckout={checkout}
        busy={busy}
        imageVersion={imageVersion}
      />
    </div>
  );
};

export default Cart;
