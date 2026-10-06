import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { BRAND, HERO_IMAGE } from "../config";

const Login = () => {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from || (user.role === "admin" ? "/admin" : "/")} replace />;

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = mode === "login" ? await login(form.email, form.password) : await register(form);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    navigate(from || (res.user.role === "admin" ? "/admin" : "/"), { replace: true });
  };

  return (
    <div className="auth">
      <aside className="auth-art" style={{ "--hero-image": `url(${HERO_IMAGE})` }}>
        <Link to="/" className="brand">{BRAND}</Link>
        <div>
          <h2>Pick up where you left off.</h2>
          <p>Sign in to keep your cart, check out faster and see what’s back in stock.</p>
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="segmented" role="tablist">
            <button role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
            <button role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>Create account</button>
          </div>

          <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>

          <form onSubmit={submit} noValidate>
            {mode === "register" && (
              <label className="field">
                <span>Full name</span>
                <input name="name" value={form.name} onChange={set} autoComplete="name" />
              </label>
            )}
            <label className="field">
              <span>{mode === "login" ? "Email or username" : "Email"}</span>
              <input name="email" value={form.email} onChange={set} autoComplete="username" />
            </label>
            <label className="field">
              <span>Password</span>
              <input name="password" type="password" value={form.password} onChange={set}
                autoComplete={mode === "login" ? "current-password" : "new-password"} />
            </label>

            {error && <p className="form-error" role="alert"><i className="bi bi-exclamation-circle" /> {error}</p>}

            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

        </div>
      </section>
    </div>
  );
};

export default Login;
