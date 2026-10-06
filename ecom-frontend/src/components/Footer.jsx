import { Link } from "react-router-dom";
import { BRAND, CATEGORIES } from "../config";
import { useAuth } from "../Context/AuthContext";

const Footer = () => {
  const { user } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Link to="/" className="brand">{BRAND}</Link>
          <p>Electronics, fashion and toys — shipped from stock we actually have. Real prices, honest discounts.</p>
          <div className="footer-social">
            <a href="mailto:hello@troveo.example" aria-label="Email us"><i className="bi bi-envelope" /></a>
            <a href="#" aria-label="Instagram" onClick={(e) => e.preventDefault()}><i className="bi bi-instagram" /></a>
            <a href="#" aria-label="Twitter / X" onClick={(e) => e.preventDefault()}><i className="bi bi-twitter-x" /></a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Shop</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            {CATEGORIES.slice(0, 4).map((c) => (
              <li key={c}><Link to="/">{c}</Link></li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h4>Company</h4>
          <ul>
            <li><Link to="/about">About us</Link></li>
            {!user && <li><Link to="/login">Sign in</Link></li>}
            <li><a href="mailto:hello@troveo.example">Contact</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Get in touch</h4>
          <ul>
            <li className="row"><i className="bi bi-envelope" /><span>hello@troveo.example</span></li>
            <li className="row"><i className="bi bi-telephone" /><span>+91 98765 43210</span></li>
            <li className="row"><i className="bi bi-geo-alt" /><span>New Delhi, India</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} {BRAND}. All rights reserved.</span>
        <span>Built with care, one order at a time.</span>
      </div>
    </footer>
  );
};

export default Footer;
