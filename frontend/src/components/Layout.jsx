import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom"; // Essential for SPA performance
import "./layout.css";
import InactivityLogout from "./InactivityLogout.jsx";
import { auth } from "../utils/auth.js"; // Use your central auth utility

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
        {/* Admin Only Link */}
          {role === "admin" && (
          <NavLink to="/admin" className="sidebar-link">
           <i className="bi bi-shield-lock-fill"></i>
            <span className="link-text">Admin Panel</span>
          </NavLink>
    )}

         {/* Links for EVERYONE */}
       <NavLink to="/dashboard" className="sidebar-link">
          <i className="bi bi-house-door-fill"></i>
          <span className="link-text">Dashboard</span>
       </NavLink>

      <NavLink to="/notes" className="sidebar-link">
        <i className="bi bi-journal-text"></i>
         <span className="link-text">Medical Notes</span>
      </NavLink>

          {/* ... other links ... */}

           {/* LOGOUT: Move this to the very bottom, clearly visible */}
       <div className="sidebar-footer mt-auto border-top pt-2">
        <button 
        onClick={handleLogout} 
        className="sidebar-link border-0 bg-transparent text-danger w-100 text-start"
         >
           <i className="bi bi-box-arrow-right"></i>
           <span className="link-text">Sign Out</span>
        </button>
      </div>
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
