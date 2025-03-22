import { FaHome, FaUsers, FaCog } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../index.css";

const Sidebar = () => {
  const location = useLocation(); // Get current route

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <FaHome /> },
    { name: "Users", path: "/users", icon: <FaUsers /> },
    { name: "Settings", path: "/settings", icon: <FaCog /> },
  ];

  return (
    <div className="bg-dark text-white p-3 sidebar">
      <h2 className="fw-bold mb-3">Menu</h2>
      <ul className="nav flex-column">
        {menuItems.map((item, index) => (
          <li key={index} className="nav-item">
            <Link
              to={item.path}
              className={`nav-link text-white d-flex align-items-center ${
                location.pathname === item.path ? "active-link" : ""
              }`}
            >
              {item.icon} <span className="ms-2">{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
