import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom"; // Essential for SPA performance
import "./layout.css";
import InactivityLogout from "./InactivityLogout.jsx";
import { auth } from "../utils/auth.js";

export default function Layout({ children, theme, toggleTheme }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username") || "User";

  const handleLogout = () => {
    console.log("[LAYOUT] Manual logout triggered");
    auth.logout();
    navigate("/");
  };

  return (
    <div className="layout-container">
      {/* SIDEBAR */}
      <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
        
        {/* TOP: Brand & Toggle */}
        <div className="sidebar-header">
          <div className="brand-wrapper">
            <i className="bi bi-heart-pulse-fill text-primary fs-4"></i>
            {!collapsed && <span className="sidebar-title ms-2">MedSystems</span>}
          </div>
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            <i className={`bi ${collapsed ? 'bi-list' : 'bi-chevron-left'}`}></i>
          </button>
        </div>

        {/* MIDDLE: Navigation Links */}
        <nav className="sidebar-nav">
          {role === "admin" && (
          <NavLink to="/admin" className="sidebar-link">
            <i className="bi bi-shield-lock-fill"></i>
            <span className="link-text">Admin Panel</span>
          </NavLink>
          <NavLink to="/settings" className="sidebar-link">
            <i class="bi bi-gear-fill"></i>
            <span className="link-text">Settings</span>
          </NavLink>

          )
          <NavLink to="/dashboard" className="sidebar-link">
            <i className="bi bi-house-door-fill"></i>
            <span className="link-text">Dashboard</span>          

          </NavLink>

          <NavLink to="/notes" className="sidebar-link">
            <i className="bi bi-journal-text"></i>
            <span className="link-text">Medical Notes</span>
          </NavLink>

          <NavLink to="/profile" className="sidebar-link">
            <i className="bi bi-person-circle"></i>
            <span className="link-text">My Profile</span>
          </NavLink>

          {/* BOTTOM SECTION: Pushed down by mt-auto */}
          <div className="mt-auto pt-3 border-top border-secondary border-opacity-25">
            
            {/* Theme Toggle */}
            <button className="sidebar-link border-0 bg-transparent w-100 text-start" onClick={toggleTheme}>
              <i className={`bi ${theme === "light" ? "bi-moon-fill" : "bi-sun-fill"}`}></i>
              {!collapsed && <span className="link-text">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>}
            </button>

            {/* Logout Button - Now styled exactly like other links */}
            <button 
              onClick={handleLogout} 
              className="sidebar-link border-0 bg-transparent text-danger w-100 text-start"
            >
              <i className="bi bi-box-arrow-right"></i>
              {!collapsed && <span className="link-text fw-bold">Sign Out</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* Security: Auto logout after 15 mins */}
      <InactivityLogout timeout={15 * 60 * 1000} />

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <header className="content-header shadow-sm bg-body d-flex justify-content-between align-items-center px-4 py-2">
           <span className="text-muted small">
             Path: <span className="text-primary">{location.pathname}</span>
           </span>
           <div className="badge bg-primary-subtle text-primary border border-primary-subtle p-2">
             <i className="bi bi-person-check-fill me-1"></i> {username} ({role})
           </div>
        </header>
        
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
