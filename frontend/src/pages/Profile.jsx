import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../utils/api.js"; // ROOT CAUSE FIX: Path adjusted to central API file

/**
 * Profile Component
 * Displays the current medical staff/user details.
 * Note: Wrapping is handled by ProtectedLayout in App.jsx
 */
export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile() {
    setLoading(true);
    console.log("[PROFILE] Fetching user data...");
    try {
      // ROOT CAUSE FIX: Pass only the endpoint. apiFetch handles the BASE_URL.
      const response = await apiFetch("/api/profile/");
      
      if (response.ok) {
        const data = await response.json();
        console.log("[PROFILE] Data received:", data);
        setProfile(data);
      } else {
        console.error("[PROFILE] Failed to fetch. Status:", response.status);
      }
    } catch (err) {
      console.error("[PROFILE CRASH]", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold mb-0">My Account</h2>
            <Link to="/edit-profile" className="btn btn-outline-primary btn-sm">
              <i className="bi bi-pencil-square me-2"></i>Edit Profile
            </Link>
          </div>

          <div className="card border-0 shadow-sm overflow-hidden">
            <div className="card-header bg-primary py-3"></div>
            <div className="card-body p-4">
              <div className="text-center mb-4" style={{ marginTop: "-60px" }}>
                <div className="bg-white d-inline-block p-1 rounded-circle shadow-sm">
                  <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: "100px", height: "100px" }}>
                    <i className="bi bi-person-fill text-secondary" style={{ fontSize: "3rem" }}></i>
                  </div>
                </div>
                <h4 className="mt-3 fw-bold mb-0">{profile?.username}</h4>
                <span className="badge bg-info-subtle text-info border border-info-subtle rounded-pill px-3">
                  {profile?.role?.toUpperCase()}
                </span>
              </div>

              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="text-muted small text-uppercase fw-bold">Email Address</label>
                  <p className="fs-5">{profile?.email || "Not provided"}</p>
                </div>
                <div className="col-sm-6">
                  <label className="text-muted small text-uppercase fw-bold">Phone Number</label>
                  <p className="fs-5">{profile?.phone || "Not provided"}</p>
                </div>
                <div className="col-12 border-top pt-3">
                  <label className="text-muted small text-uppercase fw-bold">Account Status</label>
                  <p className="text-success"><i className="bi bi-patch-check-fill me-2"></i>Active / Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
