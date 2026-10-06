import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

// <ProtectedRoute>            -> any logged-in user
// <ProtectedRoute role="admin"> -> admins only
const ProtectedRoute = ({ role, children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (role && user.role !== role) {
    return (
      <div className="page narrow state-box">
        <i className="bi bi-shield-lock" />
        <h2>Admins only</h2>
        <p>Your account can browse and buy products, but only admins can manage the catalogue.</p>
        <Link className="btn btn-primary" to="/">Back to shop</Link>
      </div>
    );
  }
  return children;
};

export default ProtectedRoute;
