import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAllOrders } from "../api/orders";
import { formatPrice } from "../config";

const formatDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

const Orders = () => {
  const [orders, setOrders] = useState(null); // null = loading
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetchAllOrders()
      .then(setOrders)
      .catch(() => setFailed(true));
  }, []);

  const stats = useMemo(() => {
    const list = orders || [];
    const revenue = list.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const customers = new Set(list.map((o) => o.userEmail)).size;
    return { count: list.length, revenue, customers };
  }, [orders]);

  const rows = useMemo(() => {
    const list = orders || [];
    if (!q.trim()) return list;
    const text = q.trim().toLowerCase();
    return list.filter((o) => {
      const haystack = `${o.userName} ${o.userEmail} ${(o.items || []).map((i) => i.productName).join(" ")}`.toLowerCase();
      return haystack.includes(text);
    });
  }, [orders, q]);

  return (
    <div className="page">
      <div className="section-head">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="muted">Every order placed by every shopper, newest first.</p>
        </div>
        <Link to="/admin" className="btn btn-ghost"><i className="bi bi-arrow-left" /> Dashboard</Link>
      </div>

      <div className="stats">
        <div className="stat"><small>Orders</small><strong>{stats.count}</strong></div>
        <div className="stat"><small>Revenue</small><strong>{formatPrice(stats.revenue)}</strong></div>
        <div className="stat"><small>Customers</small><strong>{stats.customers}</strong></div>
      </div>

      {failed ? (
        <div className="state-box">
          <i className="bi bi-plug" />
          <h2>Can't load orders yet</h2>
          <p>
            Your backend doesn't have the <code>/api/orders</code> endpoint yet. Add the files from
            <code> backend-orders-snippet</code> to your Spring Boot project and restart it.
          </p>
        </div>
      ) : orders === null ? (
        <div className="skeleton tall" />
      ) : orders.length === 0 ? (
        <div className="state-box">
          <i className="bi bi-receipt" />
          <h2>No orders yet</h2>
          <p>Orders will appear here as soon as a shopper checks out.</p>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <div className="search wide">
              <i className="bi bi-search" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by customer or product" aria-label="Filter orders" />
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Products</th><th>Total</th><th>Placed</th></tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>
                      <div className="row-product">
                        <div>
                          <strong>{o.userName || "—"}</strong>
                          <small className="muted">{o.userEmail}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <ul className="order-items">
                        {(o.items || []).map((it, idx) => (
                          <li key={idx}>{it.productName} <span className="muted">× {it.quantity}</span></li>
                        ))}
                      </ul>
                    </td>
                    <td><strong>{formatPrice(o.totalAmount)}</strong></td>
                    <td className="muted">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan="5" className="muted center pad">No orders match this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Orders;
