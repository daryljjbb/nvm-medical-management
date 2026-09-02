import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../utils/api.js";

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State for viewing a specific historical visit
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);

  const fetchChart = async () => {
    setLoading(true);
    console.log(`[SYSTEM] Fetching Clinical Chart for Patient: ${id}`);
    try {
      const response = await apiFetch(`/api/patients/${id}/`);
      if (response.ok) {
        const data = await response.json();
        console.log("[DATA LOADED]", data);
        setPatient(data);
      }
    } catch (err) {
      console.error("[FETCH ERROR]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChart(); }, [id]);

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary"></div>
      <p className="mt-2 text-muted">Opening Encrypted Medical File...</p>
    </div>
  );

  // --- Inside PatientDetails.jsx ---
const [prescriptions, setPrescriptions] = useState([]);
const [aiResults, setAiResults] = useState(null);
const [checkingAi, setCheckingAi] = useState(false);
const [newMedName, setNewMedName] = useState("");

// Function to call the AI
const runAiSafetyCheck = async () => {
    setCheckingAi(true);
    console.log("[AI] Starting safety cross-reference...");
    
    try {
        const res = await apiFetch("/api/med-check/", {
            method: "POST",
            body: JSON.stringify({
                patient_id: id,
                medication_name: newMedName
            })
        });
        if (res.ok) {
            setAiResults(await res.json());
        }
    } catch (err) {
        console.error(err);
    } finally {
        setCheckingAi(false);
    }
};

const handleConfirmPrescription = async (e) => {
    e.preventDefault();
    console.log("[PRESCRIPTION] Submitting to backend...");

    try {
        const res = await apiFetch("/api/prescriptions/", {
            method: "POST",
            body: JSON.stringify({
                patient: id, // The UUID from useParams
                medication_name: newMedName,
                dosage: dosage,       // from a state variable
                frequency: frequency  // from a state variable
            })
        });

        if (res.ok) {
            console.log("[SUCCESS] Prescription added to chart.");
            setShowPrescriptionModal(false);
            // Refresh the entire chart data to show the new med in the list
            fetchChart(); 
        } else {
            const errData = await res.json();
            alert("Prescription Error: " + JSON.stringify(errData));
        }
    } catch (err) {
        console.error("[CRITICAL] Failed to connect to prescription API", err);
    }
};


  if (!patient) return <div className="alert alert-danger">Patient not found.</div>;

  return (
    <div className="container-fluid py-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/patients")}>
          <i className="bi bi-arrow-left"></i> Directory
        </button>
        <Link to={`/patients/${id}/edit`} className="btn btn-primary shadow-sm">
          <i className="bi bi-pencil-square"></i> Update Patient File
        </Link>
      </div>

      <div className="row g-4">
        {/* IDENTITY CARD */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm text-center p-4 h-100">
            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{width: '80px', height: '80px'}}>
              <i className="bi bi-person-vcard text-primary fs-2"></i>
            </div>
            <h3 className="fw-bold mb-1">{patient.first_name} {patient.last_name}</h3>
            <p className="text-muted small">UUID: {patient.id}</p>
            <hr />
            <div className="text-start">
               <p className="small mb-2"><strong>DOB:</strong> {patient.date_of_birth}</p>
               <p className="small mb-2"><strong>Gender:</strong> {patient.gender}</p>
               <p className="small mb-0"><strong>Blood Type:</strong> <span className="badge bg-danger">{patient.blood_group}</span></p>
            </div>
          </div>
        </div>

        {/* EMERGENCY & CONTACT */}
        <div className="col-md-8">
          <div className="card border-0 shadow-sm p-4 h-100">
            <h6 className="fw-bold text-uppercase text-muted small mb-3 border-bottom pb-2">Emergency Contact</h6>
            <div className="row">
              <div className="col-6">
                <p className="mb-0 fw-bold">{patient.emergency_contact_name}</p>
                <p className="text-primary">{patient.emergency_contact_phone}</p>
              </div>
              <div className="col-6">
                <p className="text-muted small mb-0">City/Location</p>
                <p>{patient.city || "Not Recorded"}</p>
              </div>
            </div>
            <div className="mt-4">
               <h6 className="fw-bold text-uppercase text-muted small mb-2 border-bottom pb-2">Clinical Note Summary</h6>
               <p className="text-muted small italic">Documentation for active prescriptions and long-term care plans will appear here.</p>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT VITALS SECTION */}
      <div className="card mt-4 border-0 shadow-sm p-4">
        <h5 className="fw-bold mb-4"><i className="bi bi-activity text-danger me-2"></i>Recent Vitals</h5>
        {patient.latest_encounter ? (
          <div className="row text-center g-3">
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded shadow-sm">
                <p className="text-muted small mb-1">Blood Pressure</p>
                <h4 className="fw-bold mb-0">{patient.latest_encounter.bp_systolic}/{patient.latest_encounter.bp_diastolic}</h4>
                <small className="text-muted">mmHg</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded shadow-sm">
                <p className="text-muted small mb-1">Pulse</p>
                <h4 className="fw-bold text-primary mb-0">{patient.latest_encounter.heart_rate}</h4>
                <small className="text-muted">BPM</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded shadow-sm">
                <p className="text-muted small mb-1">Temperature</p>
                <h4 className="fw-bold mb-0">{patient.latest_encounter.temperature}°</h4>
                <small className="text-muted">Fahrenheit</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded shadow-sm">
                <p className="text-muted small mb-1">O2 Saturation</p>
                <h4 className="fw-bold mb-0">{patient.latest_encounter.o2_saturation}%</h4>
                <small className="text-muted">SpO2</small>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 border border-dashed rounded">No vitals recorded yet.</div>
        )}
      </div>

      {/* VISIT HISTORY TABLE */}
      <div className="card mt-4 border-0 shadow-sm">
        <div className="card-header bg-white py-3 border-bottom">
          <h5 className="fw-bold mb-0"><i className="bi bi-clock-history me-2"></i>Clinical Visit History</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-uppercase">
                <tr>
                  <th className="ps-4">Date</th>
                  <th>Reason</th>
                  <th>Diagnosis</th>
                  <th>Provider</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patient.visit_history?.map((visit) => (
                  <tr key={visit.encounter_id}>
                    <td className="ps-4 fw-bold text-primary">{visit.date}</td>
                    <td>{visit.reason}</td>
                    <td className="text-truncate" style={{maxWidth: '200px'}}>{visit.diagnosis}</td>
                    <td>{visit.provider}</td>
                    <td className="text-end pe-4">
                      {/* ROOT CAUSE FIX: Added handler to open modal */}
                      <button 
                        className="btn btn-sm btn-link text-decoration-none"
                        onClick={() => {
                          setSelectedVisit(visit);
                          setShowHistoryModal(true);
                        }}
                      >
                        View Full Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    // --- In the JSX, add this below Visit History ---
<div className="card mt-4 border-0 shadow-sm overflow-hidden">
    <div className="card-header bg-dark text-white py-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0"><i className="bi bi-capsule me-2"></i>Active Prescriptions</h5>
        <button className="btn btn-sm btn-outline-light" onClick={() => setShowPrescriptionModal(true)}>
            + Add Medication
        </button>
    </div>
    <div className="card-body">
        <div className="table-responsive">
            <table className="table">
                <thead>
                    <tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Status</th></tr>
                </thead>
                <tbody>
                    {/* Map through patient.prescriptions */}
                    <tr>
                        <td><strong>Lisinopril</strong></td>
                        <td>10mg</td>
                        <td>Once Daily</td>
                        <td><span className="badge bg-success">Active</span></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

{/* AI SAFETY CHECK MODAL */}
{showPrescriptionModal && (
    <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.8)'}}>
        <div className="modal-dialog modal-lg">
            <div className="modal-content">
                <div className="modal-header border-0">
                    <h5 className="fw-bold">Prescribe New Medication</h5>
                    <button className="btn-close" onClick={() => setShowPrescriptionModal(false)}></button>
                </div>
                <div className="modal-body p-4">
                    <label className="form-label fw-bold">Medication Name</label>
                    <div className="input-group mb-3">
                        <input type="text" className="form-control" placeholder="Search drug name..." 
                               onChange={(e) => setNewMedName(e.target.value)} />
                        <button className="btn btn-info text-white" onClick={runAiSafetyCheck} disabled={!newMedName || checkingAi}>
                           {checkingAi ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-robot me-1"></i> AI Safety Check</>}
                        </button>
                    </div>

                    {aiResults && (
                        <div className="alert alert-warning border-0 shadow-sm mt-4">
                            <h6 className="fw-bold text-dark"><i className="bi bi-shield-exclamation me-2"></i>AI Clinical Insights</h6>
                            <hr />
                            <p className="small"><strong>Interactions:</strong> {aiResults.interactions.join(", ")}</p>
                            <p className="small"><strong>Potential Side Effects:</strong> {aiResults.side_effects.join(", ")}</p>
                            <div className="mt-2 p-2 bg-white rounded border" style={{fontSize: '0.7rem'}}>
                                <i className="bi bi-info-circle me-1"></i> {aiResults.disclaimer}
                            </div>
                        </div>
                    )}
                </div>
                <div className="modal-footer border-0">
                    <button className="btn btn-secondary" onClick={() => setShowPrescriptionModal(false)}>Cancel</button>
                    <button className="btn btn-primary px-4">Confirm Prescription</button>
                </div>
            </div>
        </div>
    </div>
)}
      </div>

      {/* --- MODAL: HISTORICAL ENCOUNTER DETAIL --- */}
      {showHistoryModal && selectedVisit && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.7)'}}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Clinical Record: {selectedVisit.date}</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowHistoryModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row mb-4 text-center g-2">
                  <div className="col-3 border-end"><small className="text-muted d-block">BP</small><strong>{selectedVisit.vitals.bp}</strong></div>
                  <div className="col-3 border-end"><small className="text-muted d-block">HR</small><strong>{selectedVisit.vitals.hr}</strong></div>
                  <div className="col-3 border-end"><small className="text-muted d-block">TEMP</small><strong>{selectedVisit.vitals.temp}°</strong></div>
                  <div className="col-3"><small className="text-muted d-block">O2</small><strong>{selectedVisit.vitals.o2}%</strong></div>
                </div>

                <h6 className="fw-bold text-primary">Chief Complaint</h6>
                <p className="bg-light p-3 rounded">{selectedVisit.chief_complaint}</p>

                <h6 className="fw-bold text-primary mt-4">Clinical Diagnosis</h6>
                <p className="bg-light p-3 rounded">{selectedVisit.diagnosis}</p>

                <h6 className="fw-bold text-primary mt-4">Treatment Plan</h6>
                <p className="bg-light p-3 rounded">{selectedVisit.treatment_plan}</p>

                <div className="mt-4 pt-3 border-top d-flex justify-content-between">
                   <small className="text-muted">Digitally Signed By: <strong>{selectedVisit.provider}</strong></small>
                   <small className="text-muted">ID: {selectedVisit.encounter_id}</small>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>Close Chart</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
