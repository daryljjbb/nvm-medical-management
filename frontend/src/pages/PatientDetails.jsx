import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../utils/api.js"; // Centralized API helper

/**
 * PatientDetails Component
 * Acts as the 'Clinical Chart' - a read-only overview of the patient.
 */
export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchChart() {
      setLoading(true);
      console.log(`[MEDICAL] Opening Patient Chart ID: ${id}`);
      
      try {
        const response = await apiFetch(`/api/patients/${id}/`);
        if (response.ok) {
          const data = await response.json();
          setPatient(data);
          console.log("[MEDICAL] Chart data loaded successfully.");
        } else {
          setError("This patient record could not be found.");
        }
      } catch (err) {
        console.error("[FETCH ERROR]", err);
        setError("Network error. Could not connect to medical database.");
      } finally {
        setLoading(false);
      }
    }
    fetchChart();
  }, [id]);

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status"></div>
      <p className="mt-2 text-muted">Accessing Encrypted Patient File...</p>
    </div>
  );

  if (error) return (
    <div className="alert alert-danger shadow-sm border-0 m-4">
      <i className="bi bi-exclamation-octagon-fill me-2"></i> {error}
      <button className="btn btn-link" onClick={() => navigate("/patients")}>Back to Directory</button>
    </div>
  );

  return (
    <div className="container py-4">
      {/* ACTION BAR */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button className="btn btn-outline-secondary" onClick={() => navigate("/patients")}>
          <i className="bi bi-arrow-left"></i> Directory
        </button>
        <Link to={`/patients/${id}/edit`} className="btn btn-primary shadow-sm">
          <i className="bi bi-pencil-square"></i> Update Record
        </Link>
      </div>

      <div className="row g-4">
        {/* LEFT COLUMN: IDENTITY CARD */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm text-center p-4">
            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{width: '100px', height: '100px'}}>
              <i className="bi bi-person-badge text-primary fs-1"></i>
            </div>
            <h3 className="fw-bold mb-1">{patient.first_name} {patient.last_name}</h3>
            <p className="text-muted small mb-3">Patient UUID: {patient.id}</p>
            <hr />
            <div className="text-start mt-3">
              <p className="mb-2"><strong>DOB:</strong> {patient.date_of_birth}</p>
              <p className="mb-2">
                <strong>Gender:</strong> 
                <span className="badge bg-secondary-subtle text-secondary ms-2">{patient.gender === 'M' ? 'Male' : 'Female'}</span>
              </p>
              <p className="mb-0">
                <strong>Blood Type:</strong> 
                <span className="badge bg-danger ms-2">{patient.blood_group}</span>
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONTACT & CLINICAL DATA */}
        <div className="col-md-8">
          <div className="card border-0 shadow-sm p-4 h-100">
            <h5 className="fw-bold text-primary border-bottom pb-2 mb-4">
              <i className="bi bi-telephone-fill me-2"></i> Contact & Emergency Info
            </h5>
            
            <div className="row mb-4">
              <div className="col-sm-6">
                <label className="text-muted small fw-bold uppercase">City/Location</label>
                <p className="fs-5">{patient.city || "Not recorded"}</p>
              </div>
              <div className="col-sm-6">
                <label className="text-muted small fw-bold uppercase">Emergency Contact</label>
                <p className="fs-5 mb-0 fw-bold">{patient.emergency_contact_name}</p>
                <p className="text-primary">{patient.emergency_contact_phone}</p>
              </div>
            </div>

            <h5 className="fw-bold text-primary border-bottom pb-2 mb-4">
              <i className="bi bi-file-earmark-medical-fill me-2"></i> Clinical Notes Summary
            </h5>
            <div className="bg-light p-3 rounded">
               <p className="text-muted small mb-0">
                 <i className="bi bi-info-circle me-1"></i>
                 Full clinical history and encrypted notes will appear here as you add more functionality to the system.
               </p>
            </div>
          </div>
        </div>
    {/* Inside PatientDetails.jsx - Add a 'Vitals History' section */}
{/* Replace your Recent Vitals section with this improved version */}
<div className="card mt-4 border-0 shadow-sm p-4">
  <div className="d-flex justify-content-between align-items-center mb-3">
    <h5 className="fw-bold mb-0">
      <i className="bi bi-activity text-danger me-2"></i>Recent Vitals
    </h5>
    {patient.latest_encounter && (
      <span className="badge bg-light text-muted border">
        Last Recorded: {patient.latest_encounter.date}
      </span>
    )}
  </div>

  {patient.latest_encounter ? (
    <div className="row text-center g-3">
      <div className="col-6 col-md-3">
        <div className="p-3 bg-light rounded">
          <p className="text-muted small mb-1 uppercase fw-bold">Blood Pressure</p>
          <h4 className="fw-bold mb-0">
            {patient.latest_encounter.bp_systolic}/{patient.latest_encounter.bp_diastolic}
          </h4>
          <small className="text-muted">mmHg</small>
        </div>
      </div>
      <div className="col-6 col-md-3">
        <div className="p-3 bg-light rounded">
          <p className="text-muted small mb-1 uppercase fw-bold">Pulse</p>
          <h4 className="fw-bold text-primary mb-0">{patient.latest_encounter.heart_rate}</h4>
          <small className="text-muted">BPM</small>
        </div>
      </div>
      <div className="col-6 col-md-3">
        <div className="p-3 bg-light rounded">
          <p className="text-muted small mb-1 uppercase fw-bold">Temperature</p>
          <h4 className="fw-bold mb-0">{patient.latest_encounter.temperature}°</h4>
          <small className="text-muted">Fahrenheit</small>
        </div>
      </div>
      <div className="col-6 col-md-3">
        <div className="p-3 bg-light rounded">
          <p className="text-muted small mb-1 uppercase fw-bold">O2 Saturation</p>
          <h4 className="fw-bold mb-0">{patient.latest_encounter.o2_saturation}%</h4>
          <small className="text-muted">SpO2</small>
        </div>
      </div>
    </div>
  ) : (
    <div className="text-center py-4 bg-light rounded border border-dashed">
      <i className="bi bi-clipboard-x text-muted fs-2"></i>
      <p className="text-muted mt-2 mb-0">No clinical vitals recorded for this patient yet.</p>
      <small>Vitals will appear here after the first completed visit.</small>
    </div>
  )}
</div>  
  </div>
    </div>
  );
}
