import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom"; // Essential for SPA performance
import "./layout.css";
import InactivityLogout from "./InactivityLogout.jsx";
import { auth } from "../auth"; // Use your central auth utility

export default function Layout({ children, theme, toggleTheme }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  // Centralized logout logic
  const handleLogout = () => {
    console.log("[LAYOUT] Logout initiated...");
    auth.logout(); // Use the logic from auth.js to clear localStorage
    navigate("/"); // Redirect to login
  };

  return (
    <div className="layout-container">
      {/* SIDEBAR */}
      <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
        <div className="sidebar-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-shield-lock-fill fs-4 text-primary"></i>
            <h3 className="sidebar-title">{collapsed ? "ML" : "Med Login"}</h3>
          </div>

          <div className="sidebar-controls">
            {/* Collapse Toggle */}
            <button
              className="btn btn-sm btn-outline-secondary border-0"
              onClick={() => setCollapsed(!collapsed)}
              title="Toggle Sidebar"
            >
              <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* 
              NavLink automatically handles the "active" state.
              We use 'end' on the dashboard so it doesn't stay active for sub-pages.
          */}
          
          {role === "admin" && (
            <NavLink to="/admin" className="sidebar-link">
              <i className="bi bi-shield-lock-fill"></i>
              <span className="link-text">Admin Panel</span>
            </NavLink>
          )}

          <NavLink to="/dashboard" className="sidebar-link" end>
            <i className="bi bi-house-door-fill"></i>
            <span className="link-text">Dashboard</span>
          </NavLink>

          <NavLink to="/notes" className="sidebar-link">
            <i className="bi bi-journal-text"></i>
            <span className="link-text">Medical Notes</span>
          </NavLink>

          <NavLink to="/tasks" className="sidebar-link">
            <i className="bi bi-check2-square"></i>
            <span className="link-text">Tasks/Queue</span>
          </NavLink>

          <hr className="sidebar-divider" />

          <NavLink to="/profile" className="sidebar-link">
            <i className="bi bi-person-circle"></i>
            <span className="link-text">My Profile</span>
          </NavLink>

          <NavLink to="/settings" className="sidebar-link">
            <i className="bi bi-gear-wide-connected"></i>
            <span className="link-text">Settings</span>
          </NavLink>

          {/* THEME TOGGLE (Moved inside Nav for better spacing) */}
          <button className="sidebar-link border-0 bg-transparent w-100 text-start" onClick={toggleTheme}>
            <i className={theme === "light" ? "bi bi-moon-fill" : "bi bi-sun-fill"}></i>
            <span className="link-text">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
          </button>

          {/* LOGOUT */}
          <button 
            onClick={handleLogout} 
            className="sidebar-link border-0 bg-transparent text-danger w-100 text-start mt-auto"
          >
            <i className="bi bi-box-arrow-right"></i>
            <span className="link-text">Sign Out</span>
          </button>
        </nav>
      </aside>

      {/* 
          MEDICAL SECURITY: Inactivity timer. 
          If user leaves screen for 15 mins, they are bounced. 
      */}
      <InactivityLogout timeout={15 * 60 * 1000} />

      <main className="main-content">
        <header className="content-header d-flex justify-content-between align-items-center p-3 mb-3 border-bottom bg-body shadow-sm">
           <span className="text-muted small">Medical Management System v1.0</span>
           <div className="user-badge small badge bg-primary text-white p-2">
             <i className="bi bi-person-fill"></i> {localStorage.getItem("username")} ({role})
           </div>
        </header>
        
        <div className="content-inner p-3">
            {children}
        </div>
      </main>
    </div>
  );
}
