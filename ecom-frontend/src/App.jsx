import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./components/Home";
import Login from "./components/Login";
import Product from "./components/Product";
import Cart from "./components/Cart";
import Admin from "./components/Admin";
import AddProduct from "./components/AddProduct";
import UpdateProduct from "./components/UpdateProduct";
import About from "./components/About";
import Orders from "./components/Orders";
import ProtectedRoute from "./components/ProtectedRoute";
import AiAssistant from "./components/AiAssistant";

const NotFound = () => (
  <div className="page narrow state-box">
    <i className="bi bi-compass" />
    <h2>Page not found</h2>
    <p>The page you’re looking for doesn’t exist.</p>
    <Link className="btn btn-primary" to="/">Go home</Link>
  </div>
);

function App() {
  const [selectedCategory, setSelectedCategory] = useState("");

  return (
    <BrowserRouter>
      <Navbar onSelectCategory={setSelectedCategory} />
      <div className="app-body">
        <Routes>
          <Route path="/" element={<Home selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/about" element={<About />} />

          {/* any signed-in user */}
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />

          {/* admin only */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><Admin /></ProtectedRoute>} />
          <Route path="/add_product" element={<ProtectedRoute role="admin"><AddProduct /></ProtectedRoute>} />
          <Route path="/product/update/:id" element={<ProtectedRoute role="admin"><UpdateProduct /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute role="admin"><Orders /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
      <AiAssistant />
    </BrowserRouter>
  );
}

export default App;
