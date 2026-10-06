import { createContext, useContext, useState } from "react";

/*
 * DEMO AUTHENTICATION (front-end only)
 * ------------------------------------
 * Your Spring Boot backend has no login endpoints yet, so accounts live in the browser (localStorage).
 * This is fine for building/demoing the screens, but it does NOT protect your API:
 * anyone can still call POST/PUT/DELETE /api/product directly. For production, replace the
 * bodies of `login` and `register` with calls to Spring Security + JWT and secure the
 * admin endpoints on the server. The rest of the app only uses `user`, `isAdmin`, `login`,
 * `register` and `logout`, so nothing else has to change.
 */

const USERS_KEY = "tl_users";
const SESSION_KEY = "tl_session";

// Admin accounts. Add or remove admins here. Passwords are stored as SHA-256 hashes (not plain text),
// so they never appear in the source or on the login page.
// To create a hash for a new admin, run in a terminal:
//   node -e "console.log(require('crypto').createHash('sha256').update('tl:YOUR_PASSWORD').digest('hex'))"
const ADMINS = [
  { name: "Arjoo", username: "arjoo", email: "arjooyadav23@gmail.com", passwordHash: "6c49b0fbea4960e4914ab388856741a92ee528484f0e5e36ee99dec5fbd64010" },
  { name: "Mandeep", username: "mandeep", email: "mandeep@telusko.com", passwordHash: "ef98ce8464dd865c942670942e74a08a184547a75d0e9779cc959b525de34f2e" },
  { name: "Tabish", username: "tabish", email: "tabish@telusko.com", passwordHash: "5023775da7c3f7e0e2345fe13c74d2b94f63ed64c448fa7915a937efaf9de865" },
].map((a) => ({ ...a, role: "admin" }));

const hash = async (text) => {
  if (window.crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("tl:" + text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return "plain:" + text; // insecure contexts (plain http on a LAN IP) have no crypto.subtle
};

const readJSON = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readJSON(SESSION_KEY, null));

  const startSession = (u) => {
    const session = { name: u.name, email: u.email, role: u.role };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return session;
  };

  const login = async (identifier, password) => {
    const id = identifier.trim().toLowerCase();
    if (!id || !password) return { ok: false, error: "Enter your email and password." };

    const passwordHash = await hash(password);
    const admin = ADMINS.find((u) => (u.username === id || u.email === id) && u.passwordHash === passwordHash);
    if (admin) return { ok: true, user: startSession(admin) };

    const stored = readJSON(USERS_KEY, []).find((u) => u.email === id);
    if (stored && stored.passwordHash === passwordHash) return { ok: true, user: startSession(stored) };

    return { ok: false, error: "Email or password is incorrect." };
  };

  const register = async ({ name, email, password }) => {
    const mail = email.trim().toLowerCase();
    if (!name.trim()) return { ok: false, error: "Enter your name." };
    if (!/^\S+@\S+\.\S+$/.test(mail)) return { ok: false, error: "Enter a valid email address." };
    if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };

    const users = readJSON(USERS_KEY, []);
    const taken = users.some((u) => u.email === mail) || ADMINS.some((u) => u.email === mail || u.username === mail);
    if (taken) return { ok: false, error: "An account with this email already exists." };

    // Everyone who signs up is a normal shopper – only the accounts listed in ADMINS can manage products.
    const account = { name: name.trim(), email: mail, role: "user", passwordHash: await hash(password) };
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, account]));
    return { ok: true, user: startSession(account) };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin: user?.role === "admin", login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
