import React, { useState, useEffect } from "react";
import { apiFetch } from "../utils/api.js"; // ROOT CAUSE FIX: Use centralized API utility
import { auth } from "../utils/auth.js";

/**
 * Settings Component
 * Handles User Profile updates and Interface Preferences (Theme).
 */
export default function Settings({ theme, toggleTheme }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  // 1. LOAD DATA FROM SERVER (Not just localStorage)
  // This ensures the user sees the most up-to-date medical profile
  useEffect(() => {
    async function loadSettings() {
      console.log("[SETTINGS] Fetching current profile data...");
      try {
        const res = await apiFetch("/api/profile/");
        if (res.ok) {
          const data = await res.json();
          setUsername(data.username || "");
          setEmail(data.email || "");
          
          // Sync local storage in case it was stale
          localStorage.setItem("username", data.username);
        }
      } catch (err) {
        console.error("[SETTINGS ERROR]", err);
      }
    }
    loadSettings();
  }, []);

  // 2. SAVE HANDLER
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", msg: "" });

    console.log("[SETTINGS] Attempting to save profile updates...");

    try {
      const res = await apiFetch("/api/profile/", {
        method: "PUT",
        body: JSON.stringify({ username, email }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Update Local State & Storage
        localStorage.setItem("username", data.username);
        localStorage.setItem("email", data.email);
        
        setStatus({ type: "success", msg: "Profile updated successfully!" });
        console.log("[SETTINGS] Save successful.");
      } else {
        const errData = await res.json().catch(() => ({}));
        setStatus({ 
          type: "danger", 
          msg: errData.error || "Update failed. Check if username is taken." 
        });
      }
    } catch (err) {
      console.error("[SAVE CRASH]", err);
      setStatus({ type: "danger", msg: "Network error. Could not reach server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          
          <h2 className="fw-bold mb-4">
            <i className="bi bi-gear-wide-connected text-primary me-2"></i>
            System Settings
          </h2>

          {/* ACCOUNT SETTINGS CARD */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-bold">Account Information</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSave}>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">USERNAME</label>
                  <input
                    type="text"
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="bi bi-cloud-check me-2"></i>
                  )}
                  Update Profile
                </button>
              </form>

              {status.msg && (
                <div className={`alert alert-${status.type} mt-3 py-2 small text-center border-0 shadow-sm`}>
                  {status.msg}
                </div>
              )}
            </div>
          </div>

          {/* INTERFACE PREFERENCES CARD */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-bold">Interface Preferences</h5>
            </div>
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-0 fw-bold">Visual Theme</p>
                  <p className="text-muted small mb-0">Switch between light and dark modes</p>
                </div>
                <button
                  className={`btn ${theme === 'light' ? 'btn-outline-dark' : 'btn-outline-warning'}`}
                  onClick={toggleTheme}
                >
                  {theme === "light" ? (
                    <><i className="bi bi-moon-stars-fill me-2"></i> Dark Mode</>
                  ) : (
                    <><i className="bi bi-sun-fill me-2"></i> Light Mode</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* SECURITY QUICK LINKS */}
          <div className="card border-0 shadow-sm border-start border-danger border-4">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <p className="mb-0 fw-bold text-danger">Security</p>
                <p className="text-muted small mb-0">Update your account password</p>
              </div>
              <a href="/change-password" title="Change Password" className="btn btn-sm btn-danger">
                <i className="bi bi-shield-lock"></i> Update
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
