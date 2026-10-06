import { useContext, useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import AppContext from "../Context/Context";
import { useAuth } from "../Context/AuthContext";
import { searchProducts } from "../api/products";
import { BRAND, CATEGORIES } from "../config";

const Navbar = ({ onSelectCategory }) => {
  const { cartCount } = useContext(AppContext);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light-theme");
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null); // null = search closed
  const searchRef = useRef(null);
  const catRef = useRef(null);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  // close popovers when clicking elsewhere
  useEffect(() => {
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setResults(null);
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setResults(await searchProducts(query.trim()));
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const pickCategory = (category) => {
    onSelectCategory(category);
    setCatOpen(false);
    setMenuOpen(false);
    navigate("/");
    setTimeout(() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand" onClick={closeMenu}>{BRAND}</Link>

        <button className="icon-btn nav-toggle" aria-label="Toggle menu" onClick={() => setMenuOpen((o) => !o)}>
          <i className={`bi ${menuOpen ? "bi-x-lg" : "bi-list"}`} />
        </button>

        <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
          <NavLink to="/" end onClick={closeMenu}>Home</NavLink>
          <NavLink to="/about" onClick={closeMenu}>About</NavLink>

          <div className="dropdown" ref={catRef}>
            <button className="linklike" onClick={() => setCatOpen((o) => !o)} aria-expanded={catOpen}>
              Categories <i className="bi bi-chevron-down" />
            </button>
            {catOpen && (
              <div className="dropdown-menu">
                <button onClick={() => pickCategory("")}>All products</button>
                {CATEGORIES.map((c) => (
                  <button key={c} onClick={() => pickCategory(c)}>{c}</button>
                ))}
              </div>
            )}
          </div>

          {isAdmin && (
            <>
              <NavLink to="/admin" onClick={closeMenu}>Dashboard</NavLink>
              <NavLink to="/add_product" onClick={closeMenu}>Add product</NavLink>
              <NavLink to="/admin/orders" onClick={closeMenu}>Orders</NavLink>
            </>
          )}
        </nav>

        <div className={`nav-tools ${menuOpen ? "open" : ""}`}>
          <div className="search" ref={searchRef}>
            <i className="bi bi-search" />
            <input
              type="search"
              placeholder="Search products"
              aria-label="Search products"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.trim() && searchProducts(query.trim()).then(setResults).catch(() => {})}
            />
            {results && (
              <ul className="search-results">
                {results.length === 0 ? (
                  <li className="muted pad">No product matches “{query}”.</li>
                ) : (
                  results.slice(0, 8).map((r) => (
                    <li key={r.id}>
                      <Link
                        to={`/product/${r.id}`}
                        onClick={() => { setQuery(""); setResults(null); closeMenu(); }}
                      >
                        <span>{r.name}</span>
                        <small>{r.category}</small>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          <button
            className="icon-btn"
            aria-label={theme === "dark-theme" ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => setTheme(theme === "dark-theme" ? "light-theme" : "dark-theme")}
          >
            <i className={`bi ${theme === "dark-theme" ? "bi-moon-stars-fill" : "bi-sun-fill"}`} />
          </button>

          {!isAdmin && (
            <Link to="/cart" className="icon-btn cart-link" aria-label={`Cart, ${cartCount} items`} onClick={closeMenu}>
              <i className="bi bi-bag" />
              {cartCount > 0 && <span className="badge">{cartCount}</span>}
            </Link>
          )}

          {user ? (
            <div className="user-chip">
              <span className="avatar" aria-hidden>{user.name.charAt(0).toUpperCase()}</span>
              <span className="user-name">
                {user.name}
                {isAdmin && <small>Admin</small>}
              </span>
              <button className="linklike" onClick={() => { logout(); closeMenu(); navigate("/"); }}>Log out</button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm" onClick={closeMenu}>Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
