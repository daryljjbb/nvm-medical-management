
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom"; // ROOT CAUSE FIX: Required for redirection
import RequireAuth from "../components/RequireAuth.jsx";
import { apiFetch } from "../utils/api.js"; // Use the refactored api utility

/**
 * User Dashboard
 * Provides an overview of notes and tasks for medical staff/patients.
 */
export default function Dashboard() {
  const [summary, setSummary] = useState({
    total_notes: 0,
    total_tasks: 0,
    completed_tasks: 0,
    recent_notes: [],
    recent_tasks: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  // 1. SECURITY: Redirect Admins to their specific panel
  // This prevents "Role Leaking" where admins see user-specific UI
  if (role === "admin") {
    console.log("[DASHBOARD] Admin detected, redirecting to Admin Panel...");
    return <Navigate to="/admin" replace />;
  }

  /**
   * Fetch Dashboard Summary from Backend
   */
  async function fetchDashboard() {
    setLoading(true);
    console.log(`[DASHBOARD] Fetching summary for: ${username}`);

    try {
      // ROOT CAUSE FIX: Use relative path. apiFetch handles the BASE_URL.
      const response = await apiFetch("/api/dashboard/");
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      console.log("[DASHBOARD] Data received successfully", data);
      setSummary(data);
    } catch (err) {
      console.error("[DASHBOARD ERROR]", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <RequireAuth>
      <div className="container-fluid py-4">
        {/* WELCOME HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">Welcome back, {username}!</h2>
            <p className="text-muted">Here is what is happening in your medical portal today.</p>
          </div>
          <button className="btn btn-outline-primary btn-sm" onClick={fetchDashboard}>
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>

        {error && (
          <div className="alert alert-danger shadow-sm border-0" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
          </div>
        )}

        {/* ANALYTICS CARDS */}
        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm p-3">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                  <i className="bi bi-journal-text text-primary fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-0">Total Notes</h6>
                  <h3 className="fw-bold mb-0">{loading ? "..." : summary.total_notes}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm p-3">
              <div className="d-flex align-items-center">
                <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3">
                  <i className="bi bi-list-task text-warning fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-0">Total Tasks</h6>
                  <h3 className="fw-bold mb-0">{loading ? "..." : summary.total_tasks}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm p-3">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 p-3 rounded-circle me-3">
                  <i className="bi bi-check2-circle text-success fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-0">Completed</h6>
                  <h3 className="fw-bold mb-0">{loading ? "..." : summary.completed_tasks}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RECENT CONTENT SECTION */}
        <div className="row g-4">
          {/* RECENT NOTES */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="fw-bold mb-0">Recent Medical Notes</h5>
              </div>
              <div className="card-body">
                {summary.recent_notes.length === 0 ? (
                  <p className="text-muted italic">No recent notes found.</p>
                ) : (
                  summary.recent_notes.map((note) => (
                    <div key={note.id} className="border-bottom pb-3 mb-3">
                      <h6 className="fw-bold mb-1">{note.title}</h6>
                      {/* ROOT CAUSE FIX: Avoid dangerouslySetInnerHTML if possible */}
                      <p className="text-secondary small mb-1">
                        {note.content.replace(/<[^>]*>?/gm, '').substring(0, 100)}...
                      </p>
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        <i className="bi bi-clock me-1"></i>
                        {new Date(note.created_at).toLocaleString()}
                      </small>
                    </div>
                  ))
                )}
                <a href="/notes" className="btn btn-sm btn-link p-0 mt-2 text-decoration-none">View All Notes</a>
              </div>
            </div>
          </div>

          {/* RECENT TASKS */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="fw-bold mb-0">Active Tasks</h5>
              </div>
              <div className="card-body">
                {summary.recent_tasks.length === 0 ? (
                  <p className="text-muted italic">All tasks caught up!</p>
                ) : (
                  summary.recent_tasks.map((task) => (
                    <div key={task.id} className="d-flex align-items-start border-bottom pb-3 mb-3">
                      <div className="form-check me-3">
                        <input className="form-check-input" type="checkbox" readOnly checked={task.is_completed} />
                      </div>
                      <div>
                        <h6 className="fw-bold mb-1">{task.title}</h6>
                        <p className="text-secondary small mb-1">{task.description}</p>
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                           Due: {new Date(task.created_at).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  ))
                )}
                <a href="/tasks" className="btn btn-sm btn-link p-0 mt-2 text-decoration-none">Manage Task Queue</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}

