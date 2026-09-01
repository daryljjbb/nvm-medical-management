import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api.js";

export default function EditPatient() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState({
    first_name: "", last_name: "", date_of_birth: "",
    gender: "M", blood_group: "UNK", address: "",
    city: "", emergency_contact_name: "", emergency_contact_phone: ""
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  useEffect(() => {
    async function loadPatient() {
      setLoading(true);
      try {
        // ROOT CAUSE FIX: Ensure only ONE trailing slash
        const res = await apiFetch(`/api/patients/${id}/`);
        if (res.ok) {
          const data = await res.json();
          setPatient(data);
        } else {
          setStatus({ type: "danger", msg: "Could not find patient record." });
        }
      } catch (err) {
        console.error("[FETCH ERROR]", err);
      } finally {
        setLoading(false);
      }
    }
    loadPatient();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: "", msg: "" });

    try {
      // ROOT CAUSE FIX: Strictly ONE trailing slash
      const res = await apiFetch(`/api/patients/${id}/`, {
        method: "PUT",
        body: JSON.stringify(patient)
      });

      if (res.ok) {
        setStatus({ type: "success", msg: "Record updated successfully!" });
        setTimeout(() => navigate("/patients"), 1500);
      } else {
        setStatus({ type: "danger", msg: "Failed to update record." });
      }
    } catch (err) {
      console.error("[SAVE ERROR]", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("WARNING: Are you sure you want to delete this medical file permanently?")) return;
    
    console.log(`[MEDICAL] Requesting deletion for patient: ${id}`);
    try {
      // ROOT CAUSE FIX: Changed URL from .../${id}// to .../${id}/
      const res = await apiFetch(`/api/patients/${id}/`, { 
        method: "DELETE" 
      });

      if (res.ok || res.status === 204) {
        console.log("[SUCCESS] Patient deleted.");
        navigate("/patients");
      } else {
        console.error("[DELETE FAILED] Status:", res.status);
        alert("Failed to delete patient. Check Render logs.");
      }
    } catch (err) { 
      console.error("[NETWORK ERROR]", err); 
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Edit Patient: {patient.first_name} {patient.last_name}</h2>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/patients")}>Back</button>
      </div>

      <div className="card border-0 shadow-sm p-4">
        <form onSubmit={handleUpdate}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-bold">First Name</label>
              <input type="text" className="form-control" value={patient.first_name} 
                onChange={e => setPatient({...patient, first_name: e.target.value})} required />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold">Last Name</label>
              <input type="text" className="form-control" value={patient.last_name} 
                onChange={e => setPatient({...patient, last_name: e.target.value})} required />
            </div>
            <div className="col-md-4">
                <label className="form-label small fw-bold">Date of Birth</label>
                <input type="date" className="form-control" value={patient.date_of_birth} 
                  onChange={e => setPatient({...patient, date_of_birth: e.target.value})} required />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold">Blood Group</label>
              <select className="form-select" value={patient.blood_group} 
                onChange={e => setPatient({...patient, blood_group: e.target.value})}>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
                <option value="UNK">Unknown</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold">Gender</label>
              <select className="form-select" value={patient.gender} 
                onChange={e => setPatient({...patient, gender: e.target.value})}>
                <option value="M">Male</option><option value="F">Female</option><option value="O">Other</option>
              </select>
            </div>

            <div className="col-12 mt-4 pt-3 border-top d-flex gap-2">
              <button className="btn btn-primary px-4" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Update Record"}
              </button>
              <button type="button" className="btn btn-outline-danger" onClick={handleDelete}>
                <i className="bi bi-trash"></i> Delete File
              </button>
            </div>
          </div>
        </form>

        {status.msg && (
          <div className={`alert alert-${status.type} mt-4 border-0 shadow-sm`}>{status.msg}</div>
        )}
      </div>
    </div>
  );
}
