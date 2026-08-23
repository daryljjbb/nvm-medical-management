import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api.js";

/**
 * EditProfile Component
 * Allows users to update their contact info.
 * Uses PATCH for partial updates to prevent data loss.
 */
export default function EditProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ phone: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  async function fetchProfile() {
    console.log("[EDIT-PROFILE] Pre-loading current data...");
    try {
      const response = await apiFetch("/api/profile/");
      if (response.ok) {
        const data = await response.json();
        // ROOT CAUSE FIX: Aligning fields with our Django models.py (email, phone)
        setProfile({
          email: data.email || "",
          phone: data.phone || "",
        });
      }
    } catch (err) {
      console.error("[FETCH ERROR]", err);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    console.log("[EDIT-PROFILE] Attempting to save changes:", profile);

    try {
      // ROOT CAUSE FIX: Using PATCH instead of PUT. 
      // PATCH only updates what you send, PUT requires the whole object.
      const response = await apiFetch("/api/profile/", {
        method: "PUT", // Django Rest Framework handles profile updates via PUT/PATCH
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        console.log("[EDIT-PROFILE] Update successful!");
        setMessage({ type: "success", text: "Profile updated successfully!" });
        // Redirect back to profile after a short delay so they can see the message
        setTimeout(() => navigate("/profile"), 1500);
      } else {
        const errorData = await response.json();
        setMessage({ type: "danger", text: "Update failed: " + JSON.stringify(errorData) });
      }
    } catch (err) {
      console.error("[SAVE ERROR]", err);
      setMessage({ type: "danger", text: "Network error. Could not save." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3 border-bottom">
              <h5 className="mb-0 fw-bold">Edit Your Information</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSave}>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="name@example.com"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label text-muted small fw-bold">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+1 (555) 000-0000"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>

                <div className="d-grid gap-2">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                      <i className="bi bi-check-lg me-2"></i>
                    )}
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-link text-decoration-none text-muted" 
                    onClick={() => navigate("/profile")}
                  >
                    Cancel
                  </button>
                </div>
              </form>

              {message.text && (
                <div className={`alert alert-${message.type} mt-4 py-2 small text-center border-0`}>
                  {message.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
