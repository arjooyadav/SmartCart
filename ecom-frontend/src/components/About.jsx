import { Link } from "react-router-dom";
import { BRAND } from "../config";

const TEAM = [
  { name: "Arjoo", role: "Founder & Admin" },
  { name: "Mandeep", role: "Admin" },
  { name: "Tabish", role: "Admin" },
];

const About = () => (
  <div>
    <section className="about-hero">
      <h1>About {BRAND}</h1>
      <p>
        {BRAND} is a small store for laptops, headphones, phones, watches, toys and fashion —
        built so you only ever see what we actually have on the shelf. No placeholders,
        no "out of stock" surprises at checkout.
      </p>
    </section>

    <div className="page">
      <div className="about-grid">
        <div className="about-card">
          <i className="bi bi-box-seam" />
          <h3>Real stock, always</h3>
          <p>Every product you see is tracked in our database. If it's sold out, we say so.</p>
        </div>
        <div className="about-card">
          <i className="bi bi-tag" />
          <h3>Honest prices</h3>
          <p>Discounts are set by our team and shown clearly, with the original price crossed out.</p>
        </div>
        <div className="about-card">
          <i className="bi bi-shield-check" />
          <h3>Simple and secure</h3>
          <p>Your account and cart are yours alone — no one else sees what you've added.</p>
        </div>
      </div>

      <h2 className="page-title" style={{ fontSize: "1.5rem", marginTop: 24 }}>Our team</h2>
      <div className="team-grid">
        {TEAM.map((m) => (
          <div className="team-card" key={m.name}>
            <div className="team-avatar">{m.name.charAt(0)}</div>
            <strong>{m.name}</strong>
            <small>{m.role}</small>
          </div>
        ))}
      </div>
    </div>

    <div className="about-cta">
      <p className="muted">Have a question or want to sell with us?</p>
      <a className="btn btn-primary" href="mailto:hello@troveo.example">Get in touch</a>
      <p className="muted small" style={{ marginTop: 14 }}>
        <Link to="/">Back to shopping</Link>
      </p>
    </div>
  </div>
);

export default About;
