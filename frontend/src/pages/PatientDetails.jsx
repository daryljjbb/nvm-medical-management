import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../utils/api.js";

/**
 * PatientDetails - Full Clinical Chart
 * Includes: Identity, Vitals, History, and AI-Assisted Prescriptions.
 */
export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // 1. DATA STATE
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2. MODAL STATE: VISIT HISTORY
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);

  // 3. MODAL STATE: PRESCRIPTION & AI
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [newMed, setNewMed] = useState({ medication_name: "", dosage: "", frequency: "" });
  const [aiResults, setAiResults] = useState(null);
  const [checkingAi, setCheckingAi] = useState(false);

  // FETCH CORE CHART DATA
  const fetchChart = async () => {
    setLoading(true);
    console.log(`[SYSTEM] Fetching full chart for Patient UUID: ${id}`);
    try {
      const response = await apiFetch(`/api/patients/${id}/`);
      if (response.ok) {
        const data = await response.json();
        console.log("[DATA LOADED] Patient Object:", data);
        setPatient(data);
      } else {
        console.error("[FETCH ERROR] Server responded with:", response.status);
      }
    } catch (err) {
      console.error("[CRITICAL ERROR] Network failure:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChart();
  }, [id]);

  // ACTION: RUN AI SAFETY CROSS-REFERENCE
  const runAiSafetyCheck = async () => {
    if (!newMed.medication_name) return;
    setCheckingAi(true);
    setAiResults(null); // Clear old results

    console.log(`[AI] Checking safety for: ${newMed.medication_name}`);
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
        console.log("[AI RESPONSE] Insights received:", data);
        setAiResults(data);
      }
    } catch (err) {
      console.error("[AI CRASH]", err);
    } finally {
      setCheckingAi(false);
    }
  };

  // ACTION: SAVE NEW PRESCRIPTION
  const handlePrescribe = async (e) => {
    e.preventDefault();
    console.log("[PRESCRIPTION] Saving to database...");
    try {
      const res = await apiFetch("/api/prescriptions/", {
        method: "POST",
        body: JSON.stringify({ patient: id, ...newMed })
      });
      if (res.ok) {
        console.log("[SUCCESS] Medication authorized.");
        setShowHistoryModal(false); // Ensure other modals are shut
        setShowPrescriptionModal(false);
        setNewMed({ medication_name: "", dosage: "", frequency: "" });
        setAiResults(null);
        fetchChart(); // Refresh meds list in sidebar
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status"></div>
      <p className="mt-2 text-muted italic">Accessing Encrypted Clinical Data...</p>
    </div>
  );

  if (!patient) return <div className="alert alert-danger m-4">Error: Patient chart could not be retrieved.</div>;

  return (
    <div className="container-fluid py-4">
      {/* --- TOP ACTION BAR --- */}
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
        {/* --- IDENTITY CARD --- */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm text-center p-4 h-100">
            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{width: '80px', height: '80px'}}>
              <i className="bi bi-person-vcard text-primary fs-2"></i>
            </div>
            <h3 className="fw-bold mb-1">{patient.first_name} {patient.last_name}</h3>
            <p className="text-muted small">Record ID: {patient.id}</p>
            <hr />
            <div className="text-start">
              <p className="small mb-2"><strong>DOB:</strong> {patient.date_of_birth}</p>
              <p className="small mb-2"><strong>Gender:</strong> {patient.gender}</p>
              <p className="small mb-0"><strong>Blood Type:</strong> <span className="badge bg-danger">{patient.blood_group}</span></p>
            </div>
          </div>
        </div>

        {/* --- EMERGENCY & MEDICATIONS SIDEBAR --- */}
        <div className="col-md-8">
          <div className="card border-0 shadow-sm p-4 h-100">
            <h6 className="fw-bold text-uppercase text-muted small mb-3 border-bottom pb-2">Primary Emergency Contact</h6>
            <div className="row mb-4">
              <div className="col-6">
                <p className="mb-0 fw-bold">{patient.emergency_contact_name}</p>
                <p className="text-primary">{patient.emergency_contact_phone}</p>
              </div>
              <div className="col-6 text-end">
                <p className="text-muted small mb-0">Location</p>
                <p className="fw-semibold">{patient.city || "Not Recorded"}</p>
              </div>
            </div>

            <h6 className="fw-bold text-uppercase text-muted small mb-3 border-bottom pb-2">Active Medications</h6>
            <div className="d-flex flex-wrap gap-2">
              {patient.active_prescriptions?.length > 0 ? (
                patient.active_prescriptions.map((m) => (
                  <span key={m.id} className="badge bg-success-subtle text-success border border-success-subtle p-2">
                    <i className="bi bi-check2-circle me-1"></i> {m.medication_name} ({m.dosage})
                  </span>
                ))
              ) : (
                <p className="text-muted small italic">No active prescriptions detected.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- RECENT VITALS DISPLAY --- */}
      <div className="card mt-4 border-0 shadow-sm p-4">
        <h5 className="fw-bold mb-4"><i className="bi bi-activity text-danger me-2"></i>Recent Vitals</h5>
        {patient.latest_encounter ? (
          <div className="row text-center g-3">
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded border">
                <p className="text-muted small mb-1 uppercase fw-bold">Blood Pressure</p>
                <h4 className="fw-bold mb-0">{patient.latest_encounter.bp_systolic}/{patient.latest_encounter.bp_diastolic}</h4>
                <small className="text-muted italic">mmHg</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded border">
                <p className="text-muted small mb-1 uppercase fw-bold">Heart Rate</p>
                <h4 className="fw-bold text-primary mb-0">{patient.latest_encounter.heart_rate}</h4>
                <small className="text-muted italic">BPM</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded border">
                <p className="text-muted small mb-1 uppercase fw-bold">Body Temp</p>
                <h4 className="fw-bold mb-0">{patient.latest_encounter.temperature}°</h4>
                <small className="text-muted italic">Fahrenheit</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded border">
                <p className="text-muted small mb-1 uppercase fw-bold">O2 Saturation</p>
                <h4 className="fw-bold mb-0">{patient.latest_encounter.o2_saturation}%</h4>
                <small className="text-muted italic">SpO2</small>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 bg-light rounded">No vitals on record.</div>
        )}
      </div>

      {/* --- CLINICAL VISIT HISTORY TABLE --- */}
      <div className="card mt-4 border-0 shadow-sm">
        <div className="card-header bg-white py-3 border-bottom">
          <h5 className="fw-bold mb-0"><i className="bi bi-clock-history me-2"></i>Full Visit History</h5>
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
                    <td className="text-truncate" style={{maxWidth: '300px'}}>{visit.diagnosis}</td>
                    <td><i className="bi bi-person-badge me-1"></i> {visit.provider}</td>
                    <td className="text-end pe-4">
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
                {patient.visit_history?.length === 0 && (
                  <tr><td colSpan="5" className="text-center py-4 text-muted">No history found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: VIEW HISTORICAL VISIT DETAIL */}
      {showHistoryModal && selectedVisit && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.75)'}}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Medical Record: {selectedVisit.date}</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowHistoryModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row mb-4 text-center g-2">
                   <div className="col-3 border-end"><strong>{selectedVisit.vitals?.bp}</strong><br/><small className="text-muted uppercase">BP</small></div>
                   <div className="col-3 border-end"><strong>{selectedVisit.vitals?.hr}</strong><br/><small className="text-muted uppercase">Pulse</small></div>
                   <div className="col-3 border-end"><strong>{selectedVisit.vitals?.temp}°</strong><br/><small className="text-muted uppercase">Temp</small></div>
                   <div className="col-3"><strong>{selectedVisit.vitals?.o2}%</strong><br/><small className="text-muted uppercase">O2</small></div>
                </div>
                <h6 className="fw-bold text-primary">Chief Complaint</h6>
                <p className="bg-light p-3 rounded small">{selectedVisit.chief_complaint || "None recorded"}</p>
                <h6 className="fw-bold text-primary mt-4">Assessment / Diagnosis</h6>
                <p className="bg-light p-3 rounded small">{selectedVisit.diagnosis}</p>
                <h6 className="fw-bold text-primary mt-4">Treatment Plan</h6>
                <p className="bg-light p-3 rounded small">{selectedVisit.treatment_plan}</p>
              </div>
              <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>Close</button></div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NEW PRESCRIPTION & AI SAFETY CHECK */}
      {showPrescriptionModal && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.85)'}}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0">
              <div className="modal-header border-bottom py-3">
                <h5 className="fw-bold mb-0">Authorized Prescription Order</h5>
                <button className="btn-close" onClick={() => setShowPrescriptionModal(false)}></button>
              </div>
              <form onSubmit={handlePrescribe}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label fw-bold small uppercase">Drug Name</label>
                      <div className="input-group">
                        <input type="text" className="form-control" required placeholder="Search medication..." 
                               value={newMed.medication_name} onChange={e => setNewMed({...newMed, medication_name: e.target.value})} />
                        <button type="button" className="btn btn-info text-white fw-bold" onClick={runAiSafetyCheck} disabled={checkingAi || !newMed.medication_name}>
                          {checkingAi ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-robot"></i> AI Safety Check</>}
                        </button>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small uppercase">Dosage</label>
                      <input type="text" className="form-control" required placeholder="e.g. 500mg" 
                             value={newMed.dosage} onChange={e => setNewMed({...newMed, dosage: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small uppercase">Frequency</label>
                      <input type="text" className="form-control" required placeholder="e.g. Twice Daily" 
                             value={newMed.frequency} onChange={e => setNewMed({...newMed, frequency: e.target.value})} />
                    </div>
                  </div>

                  {/* AI WARNING / RESULTS BOX */}
                  {aiResults && (
                    <div className="alert alert-warning border-0 shadow-sm mt-4 p-4">
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-shield-fill-exclamation text-danger fs-4 me-2"></i>
                        <h6 className="fw-bold mb-0 text-dark">Clinical Intelligence Report</h6>
                      </div>
                      <hr className="mt-2" />
                      <div className="mb-3">
                        <p className="small mb-1 fw-bold text-uppercase text-muted">Potential Drug Interactions:</p>
                        <ul className="mb-0">
                          {aiResults.interactions?.map((msg, i) => (
                            <li key={i} className="text-danger small fw-bold">{msg}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="small mb-1 fw-bold text-uppercase text-muted">Observed Side Effects:</p>
                        <p className="small text-dark mb-0">{aiResults.side_effects?.join(", ")}</p>
                      </div>
                      <div className="mt-3 p-2 bg-white rounded border border-warning" style={{fontSize: '0.65rem'}}>
                        <i className="bi bi-info-circle me-1"></i> {aiResults.disclaimer}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPrescriptionModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 fw-bold">Sign & Prescribe</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
