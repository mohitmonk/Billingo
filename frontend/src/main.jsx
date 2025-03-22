import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import "./index.css"; // Ensure Tailwind CSS is working
import "bootstrap/dist/css/bootstrap.min.css"; // Ensure Bootstrap is loaded after Tailwind
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider> {/* Wrapped CartProvider */}
        <Router>
          <App />
        </Router>
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);
