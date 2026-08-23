import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../auth'; // Import the central auth utility we created

/**
 * Navbar Component (Top Bar)
 * Refactored to use NavLink for SPA performance and 
 * the centralized auth utility for secure logout.
 */
export default function Navbar() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "User";

  const handleLogout = () => {
    console.log(`[NAVBAR] Logout initiated for: ${username}`);
    
    // ROOT CAUSE FIX: 
    // We use the central auth.logout() to ensure 'token', 'role', 
    // and 'username' are ALL cleared, preventing "Ghost Sessions".
    auth.logout(); 
    
    // Redirect to login page immediately
    navigate("/");
  };

  return (
    <nav className="navbar navbar-expand-lg border-bottom bg-body-tertiary px-4 py-2 shadow-sm">
      <div className="container-fluid">
        {/* Brand/Logo */}
        <NavLink className="navbar-brand d-flex align-items-center gap-2" to="/dashboard">
          <i className="bi bi-heart-pulse-fill text-danger"></i>
          <span className="fw-bold">MedSystems</span>
        </NavLink>

        {/* Right Side Items */}
        <div className="d-flex align-items-center gap-3 ms-auto">
          
          {/* Quick Nav Links (Visible on desktop) */}
          <div className="d-none d-md-flex gap-2">
            <NavLink to="/notes" className={({ isActive }) => 
              `btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline-secondary'}`
            }>
              Notes
            </NavLink>
            <NavLink to="/tasks" className={({ isActive }) => 
              `btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline-secondary'}`
            }>
              Tasks
            </NavLink>
          </div>

          <div className="vr mx-2"></div> {/* Vertical Divider */}

          {/* User Profile Dropdown / Link */}
          <NavLink to="/profile" className="text-decoration-none d-flex align-items-center gap-2">
             <div className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                {username.charAt(0).toUpperCase()}
             </div>
             <span className="d-none d-sm-inline text-body">{username}</span>
          </NavLink>

          {/* Logout Button */}
          <button 
            className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2" 
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right"></i>
            <span className="d-none d-sm-inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
