import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Use hooks for SPA navigation
import { apiFetch } from "../utils/api.js"; // Use our centralized, environment-aware fetch

/**
 * EditNote Component
 * Allows medical staff to modify or remove existing clinical notes.
 */
export default function EditNote() {
  const { id } = useParams();
  const navigate = useNavigate();

  // 1. STATE MANAGEMENT
  const [content, setContent] = useState("");
  const [receiverName, setReceiverName] = useState(""); // For display purposes
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  /**
   * Fetch specific note data from the backend
   */
  async function fetchNote() {
    setLoading(true);
    console.log(`[EDIT NOTE] Loading record ID: ${id}`);
    try {
      // Path matches Django: path('notes/<uuid:id>/', ...) 
      const response = await apiFetch(`/api/notes/${id}/`);

      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
        setReceiverName(data.receiver_name); // Show who the note was for
        console.log("[EDIT NOTE] Data loaded successfully");
      } else {
        setMessage({ type: "danger", text: "Note not found or access denied." });
      }
    } catch (err) {
      console.error("[FETCH ERROR]", err);
      setMessage({ type: "danger", text: "Network error fetching note." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNote();
  }, [id]);

  /**
   * Update the record
   */
  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await apiFetch(`/api/notes/${id}/`, {
        method: "PUT",
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        console.log("[EDIT NOTE] Update successful");
        setMessage({ type: "success", text: "Record updated successfully." });
        // Redirect back to clinical notes list after a short delay
        setTimeout(() => navigate("/notes"), 1000);
      } else {
        const data = await response.json().catch(() => ({}));
        setMessage({ type: "danger", text: data.error || "Update failed." });
      }
    } catch (err) {
      console.error("[SAVE ERROR]", err);
      setMessage({ type: "danger", text: "Failed to connect to server." });
    } finally {
      setSaving(false);
    }
  }

  /**
   * Remove the record
   */
  async function handleDelete() {
    if (!window.confirm("CRITICAL: Are you sure you want to delete this clinical record?")) return;

    try {
      const response = await apiFetch(`/api/notes/${id}/`, {
        method: "DELETE",
      });

      if (response.ok || response.status === 204) {
        console.log("[EDIT NOTE] Record deleted");
        navigate("/notes"); // Redirect immediately
      } else {
        setMessage({ type: "danger", text: "Failed to delete record." });
      }
    } catch (err) {
      console.error("[DELETE ERROR]", err);
    }
  }

  // Loading UI
  if (loading && !message.text) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Retrieving medical record...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold mb-0">
              <i className="bi bi-pencil-square text-primary me-2"></i>
              Modify Entry
            </h2>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/notes")}>
              <i className="bi bi-arrow-left me-1"></i> Back to Notes
            </button>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="alert alert-info py-2 small border-0 mb-4">
                <i className="bi bi-info-circle-fill me-2"></i>
                Editing note sent to: <strong>{receiverName}</strong>
              </div>

              <form onSubmit={handleSave}>
                <div className="mb-4">
                  <label className="form-label fw-bold text-muted small uppercase">Clinical Observations</label>
                  <textarea
                    className="form-control"
                    rows="8"
                    placeholder="Enter updated content..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                      <i className="bi bi-check-lg me-2"></i>
                    )}
                    Save Updates
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-outline-danger" 
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    <i className="bi bi-trash me-1"></i> Delete Record
                  </button>
                </div>
              </form>

              {message.text && (
                <div className={`alert alert-${message.type} mt-4 py-2 border-0 small text-center shadow-sm`}>
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
