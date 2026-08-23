import { useState } from "react";
import "./layout.css";
import InactivityLogout from "./InactivityLogout.jsx";


export default function Layout({ children, theme, toggleTheme }) {
  const [collapsed, setCollapsed] = useState(false);
  const role = localStorage.getItem("role");

  return (
    <div className="layout-container">
      <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
        <div className="sidebar-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-shield-lock-fill fs-4"></i>
            <h3 className="sidebar-title">{collapsed ? "SL" : "Simple Login"}</h3>
          </div>


          <div className="sidebar-controls">
            <li className="mt-3">
            <button
                className="btn btn-outline-secondary w-100 d-flex align-items-center gap-2"
                onClick={toggleTheme}
            >
                {theme === "light" ? (
                <>
                    <i className="bi bi-moon-fill"></i> Dark Mode
                </>
                ) : (
                <>
                    <i className="bi bi-sun-fill"></i> Light Mode
                </>
                )}
            </button>
            </li>

            <button
              className="theme-btn"
              onClick={() => document.body.classList.toggle("light-theme")}
            >
              🎨
            </button>

            <button
              className="collapse-btn"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? ">" : "<"}
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">

            {role === "admin" && (
                <a href="/admin" className="sidebar-link d-flex align-items-center gap-2">
                <i className="bi bi-shield-lock-fill"></i>
                <span className="link-text">Admin Dashboard</span>
                </a>
            )}

            <a href="/dashboard" className="sidebar-link d-flex align-items-center gap-2">
                <i className="bi bi-house-door-fill"></i>
                <span className="link-text">Dashboard</span>
            </a>

            <a href="/notes" className="sidebar-link d-flex align-items-center gap-2">
                <i className="bi bi-journal-text"></i>
                <span className="link-text">Notes</span>
            </a>

            <a href="/tasks" className="sidebar-link d-flex align-items-center gap-2">
                <i className="bi bi-check2-square"></i>
                <span className="link-text">Tasks</span>
            </a>

            <a href="/profile" className="sidebar-link d-flex align-items-center gap-2">
                <i className="bi bi-person-circle"></i>
                <span className="link-text">Profile</span>
            </a>

            <a href="/edit-profile" className="sidebar-link d-flex align-items-center gap-2">
                <i className="bi bi-gear-fill"></i>
                <span className="link-text">Edit Profile</span>
            </a>

            <a href="/change-password" className="sidebar-link d-flex align-items-center gap-2">
                <i className="bi bi-key-fill"></i>
                <span className="link-text">Change Password</span>
            </a>
            <a href="/settings" className="sidebar-link d-flex align-items-center gap-2">
            <i className="bi bi-gear-wide-connected"></i>
            <span className="link-text">Settings</span>
            </a>


            <a href="/logout" className="sidebar-link d-flex align-items-center gap-2 text-danger">
                <i className="bi bi-box-arrow-right"></i>
                <span className="link-text">Logout</span>
            </a>

        </nav>

      </aside>
    <InactivityLogout timeout={15 * 60 * 1000} />
      <main className="main-content">{children}</main>
    </div>
  );
}
