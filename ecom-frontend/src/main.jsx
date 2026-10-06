import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles.css";
import { AppProvider } from "./Context/Context.jsx";
import { AuthProvider } from "./Context/AuthContext.jsx";
import { ToastProvider } from "./Context/ToastContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <AppProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AppProvider>
    </AuthProvider>
  </React.StrictMode>
);
