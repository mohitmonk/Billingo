import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import Navbar from "./Navbar"; // Adjust path as needed
import Sidebar from "./Sidebar"; // Adjust path as needed
import "../assets/Layout.css"; // Optional: For layout styling

// Main Layout component
const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Memoized toggle function to prevent unnecessary re-renders
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prevState) => !prevState);
  }, []); // Empty dependency array since it doesn't rely on external values

  return (
    <div className="layout-container">
      {/* Navbar with sidebar toggle functionality */}
      <Navbar onToggleSidebar={toggleSidebar} />
      
      {/* Main content wrapper */}
      <div className="main-content">
        {/* Sidebar with controlled visibility */}
        <Sidebar isOpen={isSidebarOpen} />
        
        {/* Dynamic page content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

// PropTypes for type checking
Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

// Default props (optional, if needed)
Layout.defaultProps = {
  children: null,
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(Layout);