import axios from "../axios";
import { useState, useEffect, useCallback, createContext, useMemo } from "react";
import { useAuth } from "./AuthContext";

const AppContext = createContext(null);

// Every account gets its own cart, so shoppers never see each other's items.
const cartKey = (email) => `cart:${email}`;

const loadLocalCart = (email) => {
  try {
    const saved = JSON.parse(localStorage.getItem(cartKey(email))) || [];
    return saved.map(({ id, quantity }) => ({ id, quantity }));
  } catch {
    return [];
  }
};

export const AppProvider = ({ children }) => {
  const [data, setData] = useState([]);
  const [isError, setIsError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [imageVersion, setImageVersion] = useState(0);
  const { user, isAdmin } = useAuth();
  const email = user?.email;
  const [cart, setCart] = useState([]);
  const [cartOwner, setCartOwner] = useState(null); // whose cart is currently loaded (null = still loading)

  const refreshData = useCallback(async () => {
    try {
      const response = await axios.get("/products");
      setData(response.data);
      setIsError("");
      setImageVersion((v) => v + 1);
    } catch (error) {
      setIsError(error.message || "Could not reach the server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Load the signed-in user's cart: from the database if the backend has the cart API, otherwise from this browser.
  useEffect(() => {
    setCartOwner(null);
    if (!email) {
      setCart([]);
      return;
    }
    let cancelled = false;
    setCart(loadLocalCart(email));
    axios
      .get("/cart", { params: { email } })
      .then((res) => {
        if (!cancelled) setCart(res.data.map(({ productId, quantity }) => ({ id: productId, quantity })));
      })
      .catch(() => {}) // no cart API yet -> keep the browser copy
      .finally(() => {
        if (!cancelled) setCartOwner(email);
      });
    return () => {
      cancelled = true;
    };
  }, [email]);

  // Save every change to this browser and to the database straight away.
  useEffect(() => {
    if (!email || cartOwner !== email) return;
    localStorage.setItem(cartKey(email), JSON.stringify(cart));
    axios
      .put("/cart", cart.map(({ id, quantity }) => ({ productId: id, quantity })), { params: { email } })
      .catch(() => {});
  }, [cart, email, cartOwner]);

  const addToCart = (product) => {
    if (!email) return { ok: false, message: "Sign in to add items to your cart" };
    if (isAdmin) return { ok: false, message: "Admin accounts can't buy products" };
    const stock = Number(product.stockQuantity) || 0;
    const existing = cart.find((i) => String(i.id) === String(product.id));
    const nextQty = (existing?.quantity || 0) + 1;
    if (nextQty > stock) return { ok: false, message: `Only ${stock} in stock` };
    setCart(
      existing
        ? cart.map((i) => (String(i.id) === String(product.id) ? { ...i, quantity: nextQty } : i))
        : [...cart, { id: product.id, quantity: 1 }]
    );
    return { ok: true, message: `${product.name} added to cart` };
  };

  const updateQuantity = (id, quantity) =>
    setCart((c) => c.map((i) => (String(i.id) === String(id) ? { ...i, quantity } : i)));

  const removeFromCart = (id) => setCart((c) => c.filter((i) => String(i.id) !== String(id)));
  const clearCart = () => setCart([]);

  // Cart lines joined with the live product data (drops products that no longer exist)
  const cartItems = useMemo(
    () =>
      cart
        .map((line) => {
          const product = data.find((p) => String(p.id) === String(line.id));
          return product ? { ...product, quantity: line.quantity } : null;
        })
        .filter(Boolean),
    [cart, data]
  );
  const cartCount = cartItems.reduce((n, i) => n + i.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        data, isError, isLoading, imageVersion,
        cart, cartItems, cartCount,
        addToCart, updateQuantity, removeFromCart, clearCart, refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
