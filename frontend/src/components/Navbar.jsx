import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUserCircle, FaBars, FaShoppingCart } from "react-icons/fa";
import { AiOutlineHome, AiOutlineDashboard } from "react-icons/ai";
import { BsGrid, BsBox, BsPerson } from "react-icons/bs";
import { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../index.css";
import billingoLogo from "../assets/billingo1.png";


const Navbar = ({ onToggleSidebar}) => {
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
    <nav className="navbar navbar-dark bg-dark shadow fixed-top w-100">
    <div className="container-fluid d-flex align-items-center justify-content-between px-2">
      {/* Sidebar Toggle & Branding */}
      <div className="d-flex align-items-center gap-2">
        <button
          className="btn btn-outline-light p-2"
          onClick={() => {
            console.log("Toggle button clicked");
            onToggleSidebar();
          }}
        >
          <FaBars size={18} />
        </button>
        <img
          src={billingoLogo}
          alt="Billingo"
          id="logo2"
          style={{ height: "36px", cursor: "pointer" }}
          onClick={() => navigate("/home")}
        />
      </div>

      {/* Navbar Items */}
      <div className="d-flex align-items-center gap-2 gap-lg-3">
        {navItems.map((item, index) => (
          <button
            key={index}
            className={`btn btn-link nav-btn d-flex flex-column align-items-center text-decoration-none text-light ${
              location.pathname === item.path ? "active-tab" : "inactive-tab"
            }`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            <small className="nav-text">{item.name}</small>
          </button>
        ))}

        {/* User Dropdown */}
        <div className="dropdown position-relative" ref={dropdownRef}>
          <button
            className="btn btn-outline-light p-2"
            onClick={(event) => {
              event.stopPropagation();
              setDropdownOpen(!dropdownOpen);
            }}
          >
            <FaUserCircle size={20} />
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
