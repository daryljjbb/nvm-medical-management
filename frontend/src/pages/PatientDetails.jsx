import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../utils/api.js";

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State for Historical Visits
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);

  // Modal State for Prescriptions & AI
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [newMed, setNewMed] = useState({ medication_name: "", dosage: "", frequency: "" });
  const [aiResults, setAiResults] = useState(null);
  const [checkingAi, setCheckingAi] = useState(false);

  const fetchChart = async () => {
    setLoading(true);
    console.log(`[SYSTEM] Fetching chart for UUID: ${id}`);
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

  // AI SAFETY CHECK LOGIC
  const runAiSafetyCheck = async () => {
    if (!newMed.medication_name) return;
    setCheckingAi(true);
    setAiResults(null);
    try {
      const res = await apiFetch("/api/med-check/", {
        method: "POST",
        body: JSON.stringify({
          patient_id: id,
          medication_name: newMed.medication_name
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingAi(false);
    }
  };

  // SAVE PRESCRIPTION LOGIC
  const handlePrescribe = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/prescriptions/", {
        method: "POST",
        body: JSON.stringify({ patient: id, ...newMed })
      });
      if (res.ok) {
        setShowPrescriptionModal(false);
        setNewMed({ medication_name: "", dosage: "", frequency: "" });
        setAiResults(null);
        fetchChart(); // Refresh meds list
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary"></div>
      <p className="mt-2 text-muted">Accessing Clinical Records...</p>
    </div>
  );

  if (!patient) return <div className="alert alert-danger">Patient not found.</div>;

  return (
    <div className="container-fluid py-4">
      {/* ACTION BAR */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/patients")}>
          <i className="bi bi-arrow-left"></i> Directory
        </button>
        <div className="d-flex gap-2">
          <button className="btn btn-dark shadow-sm" onClick={() => setShowPrescriptionModal(true)}>
            <i className="bi bi-capsule me-1"></i> New Prescription
          </button>
          <Link to={`/patients/${id}/edit`} className="btn btn-primary shadow-sm">
            <i className="bi bi-pencil-square"></i> Update Profile
          </Link>
        </div>
      </div>

      <div className="row g-4">
        {/* IDENTITY CARD */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm text-center p-4 h-100">
            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{width: '80px', height: '80px'}}>
              <i className="bi bi-person-badge text-primary fs-2"></i>
            </div>
            <h3 className="fw-bold mb-1">{patient.first_name} {patient.last_name}</h3>
            <p className="text-muted small">DOB: {patient.date_of_birth}</p>
            <div className="d-flex justify-content-center gap-2 mt-2">
              <span className="badge bg-secondary-subtle text-secondary border">{patient.gender}</span>
              <span className="badge bg-danger-subtle text-danger border">{patient.blood_group}</span>
            </div>
          </div>
        </div>

        {/* EMERGENCY CONTACT */}
        <div className="col-md-8">
          <div className="card border-0 shadow-sm p-4 h-100">
            <h6 className="fw-bold text-uppercase text-muted small mb-3 border-bottom pb-2">Emergency Contact</h6>
            <div className="row">
              <div className="col-6">
                <p className="mb-0 fw-bold">{patient.emergency_contact_name}</p>
                <p className="text-primary">{patient.emergency_contact_phone}</p>
              </div>
            </div>
            <div className="mt-4">
              <h6 className="fw-bold text-uppercase text-muted small mb-2 border-bottom pb-2">Active Medications</h6>
              <div className="d-flex flex-wrap gap-2">
                {patient.active_prescriptions?.length > 0 ? (
                  patient.active_prescriptions.map(m => (
                    <span key={m.id} className="badge bg-success-subtle text-success border p-2">
                      <i className="bi bi-check2-circle me-1"></i> {m.medication_name} ({m.dosage})
                    </span>
                  ))
                ) : (
                  <p className="text-muted small italic">No active prescriptions on file.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT VITALS */}
      <div className="card mt-4 border-0 shadow-sm p-4">
        <h5 className="fw-bold mb-4"><i className="bi bi-activity text-danger me-2"></i>Recent Vitals</h5>
        {patient.latest_encounter ? (
          <div className="row text-center g-3">
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded border">
                <p className="text-muted small mb-1">Blood Pressure</p>
                <h4 className="fw-bold mb-0">{patient.latest_encounter.bp_systolic}/{patient.latest_encounter.bp_diastolic}</h4>
                <small className="text-muted">mmHg</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded border">
                <p className="text-muted small mb-1">Pulse</p>
                <h4 className="fw-bold text-primary mb-0">{patient.latest_encounter.heart_rate}</h4>
                <small className="text-muted">BPM</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded border">
                <p className="text-muted small mb-1">Temperature</p>
                <h4 className="fw-bold mb-0">{patient.latest_encounter.temperature}°</h4>
                <small className="text-muted">Fahrenheit</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded border">
                <p className="text-muted small mb-1">O2 Saturation</p>
                <h4 className="fw-bold mb-0">{patient.latest_encounter.o2_saturation}%</h4>
                <small className="text-muted">SpO2</small>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted mb-0">No vitals recorded yet.</p>
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
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patient.visit_history?.map((visit) => (
                  <tr key={visit.encounter_id}>
                    <td className="ps-4 fw-bold text-primary">{visit.date}</td>
                    <td>{visit.reason}</td>
                    <td className="text-truncate" style={{maxWidth: '300px'}}>{visit.diagnosis}</td>
                    <td className="text-end pe-4">
                      {/* ROOT CAUSE FIX: Ensure we only pass strings to these tags */}
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
      </div>

      {/* MODAL: VIEW VISIT RECORD */}
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
                  <div className="col-3 border-end"><small className="text-muted d-block uppercase fw-bold" style={{fontSize: '0.6rem'}}>BP</small><strong>{selectedVisit.vitals.bp}</strong></div>
                  <div className="col-3 border-end"><small className="text-muted d-block uppercase fw-bold" style={{fontSize: '0.6rem'}}>HR</small><strong>{selectedVisit.vitals.hr}</strong></div>
                  <div className="col-3 border-end"><small className="text-muted d-block uppercase fw-bold" style={{fontSize: '0.6rem'}}>TEMP</small><strong>{selectedVisit.vitals.temp}°</strong></div>
                  <div className="col-3"><small className="text-muted d-block uppercase fw-bold" style={{fontSize: '0.6rem'}}>O2</small><strong>{selectedVisit.vitals.o2}%</strong></div>
                </div>
                <h6 className="fw-bold text-primary">Chief Complaint</h6>
                <p className="bg-light p-3 rounded">{selectedVisit.chief_complaint}</p>
                <h6 className="fw-bold text-primary mt-4">Diagnosis</h6>
                <p className="bg-light p-3 rounded">{selectedVisit.diagnosis}</p>
                <h6 className="fw-bold text-primary mt-4">Treatment Plan</h6>
                <p className="bg-light p-3 rounded">{selectedVisit.treatment_plan}</p>
              </div>
              <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>Close</button></div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD PRESCRIPTION & AI CHECK */}
      {showPrescriptionModal && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.8)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0">
              <div className="modal-header border-bottom">
                <h5 className="fw-bold">Prescribe New Medication</h5>
                <button className="btn-close" onClick={() => setShowPrescriptionModal(false)}></button>
              </div>
              <form onSubmit={handlePrescribe}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label fw-bold">Medication Name</label>
                      <div className="input-group">
                        <input type="text" className="form-control" required placeholder="Search drug..." 
                               value={newMed.medication_name} onChange={e => setNewMed({...newMed, medication_name: e.target.value})} />
                        <button type="button" className="btn btn-info text-white" onClick={runAiSafetyCheck} disabled={checkingAi || !newMed.medication_name}>
                          {checkingAi ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-robot me-1"></i> AI Safety Check</>}
                        </button>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Dosage</label>
                      <input type="text" className="form-control" required placeholder="e.g. 10mg" 
                             value={newMed.dosage} onChange={e => setNewMed({...newMed, dosage: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Frequency</label>
                      <input type="text" className="form-control" required placeholder="e.g. Once Daily" 
                             value={newMed.frequency} onChange={e => setNewMed({...newMed, frequency: e.target.value})} />
                    </div>
                  </div>

                  {aiResults && (
                    <div className="alert alert-warning border-0 shadow-sm mt-4">
                      <h6 className="fw-bold text-dark"><i className="bi bi-shield-exclamation me-2"></i>AI Clinical Insights</h6>
                      <hr />
                      <p className="small mb-1"><strong>Interactions:</strong> {aiResults.interactions?.join(", ")}</p>
                      <p className="small mb-0"><strong>Potential Side Effects:</strong> {aiResults.side_effects?.join(", ")}</p>
                      <div className="mt-2 p-2 bg-white rounded border" style={{fontSize: '0.65rem'}}>
                        <i className="bi bi-info-circle me-1"></i> {aiResults.disclaimer}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPrescriptionModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4">Authorize Prescription</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
