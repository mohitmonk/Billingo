import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUserCircle, FaBars, FaShoppingCart } from "react-icons/fa";
import { AiOutlineHome, AiOutlineDashboard } from "react-icons/ai";
import { BsGrid, BsBox, BsPerson } from "react-icons/bs";
import { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../index.css";
import "../pages/Cart"
import billingoLogo from "../assets/billingo1.png";


const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Logout Function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const navItems = [
    { name: "Home", path: "/", icon: <AiOutlineHome size={20} /> },
    { name: "Dashboard", path: "/dashboard", icon: <AiOutlineDashboard size={20} /> },
    { name: "Orders", path: "/orders", icon: <BsGrid size={20} /> },
    { name: "Products", path: "/products", icon: <BsBox size={20} /> },
    { name: "Customers", path: "/customers", icon: <BsPerson size={20} /> },
  ];

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow fixed-top w-100">
      <div className="container-fluid">
        {/* Sidebar Toggle & Branding */}
        <div className="d-flex align-items-center">
          <button className="btn btn-outline-light me-2" onClick={toggleSidebar}>
            <FaBars />
          </button>
          <img
            src={billingoLogo}
            alt="Billingo"
            id="logo2"
            style={{ height: "40px", cursor: "pointer" }}
            onClick={() => navigate("/dashboard")}
          />
        </div>

        {/* Navbar Items */}
        <div className="d-flex ms-auto gap-4 align-items-center">
          {navItems.map((item, index) => (
            <button
              key={index}
              className={`btn btn-link d-flex flex-column align-items-center text-decoration-none ${
                location.pathname === item.path ? "active-tab" : "inactive-tab"
              }`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <small>{item.name}</small>
            </button>
          ))}

          {/* User Dropdown */}
          <div className="dropdown position-relative" ref={dropdownRef}>
            <button
              className="btn btn-outline-light dropdown-toggle"
              onClick={(event) => {
                event.stopPropagation();
                setDropdownOpen(!dropdownOpen);
              }}
            >
              <FaUserCircle className="me-2" size={22} />
            </button>

            <ul
              className={`dropdown-menu dropdown-menu-end ${dropdownOpen ? "show" : ""}`}
              style={{ right: 0 }}
            >
              <li>
                <button className="dropdown-item" onClick={handleLogout}>
                  Logout
                </button>
              </li>
              <li>
                <button className="dropdown-item" onClick={() => navigate("/edit-profile")}>
                  Edit Profile
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
