import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "./config/firebase";
import { signOut } from "firebase/auth";
import Login from "./pages/login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import EditProfile from "./pages/EditProfile";
import Products from "./pages/products";
import Home from "./pages/Home"; // ✅ Imported Home Component
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout"

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Logout Function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login"); // Redirect to login after logout
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      <Route path="/home" element={user ? <Home user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      <Route path="/edit-profile" element={user ? <EditProfile /> : <Navigate to="/login" />} />
      <Route path="/products" element={user ? <Products /> : <Navigate to="/login" />} />
      <Route path="/cart" element={user ? <Cart /> : <Navigate to="/login" />} />
      <Route path="/checkout" element={<Checkout />} />
      
      {/* ✅ Default Redirect */}
      <Route path="*" element={<Navigate to={user ? "/home" : "/login"} />} />
    </Routes>
  );
}

export default App;
