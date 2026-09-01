import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js"; // Standardized path

/**
 * Appointments Component
 * Handles Scheduling (Booking) and Clinical Encounters (Vitals/Notes).
 */
export default function Appointments() {
  // 1. DATA STATE
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. MODAL VISIBILITY STATE
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showEncounterModal, setShowEncounterModal] = useState(false);

  // 3. FORM STATE: BOOKING
  const [newAppt, setNewAppt] = useState({
    patient: "",
    date_time: "",
    reason: "",
  });

  // 4. FORM STATE: CLINICAL ENCOUNTER (Vitals & Observations)
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [encounterForm, setEncounterForm] = useState({
    bp_systolic: "",
    bp_diastolic: "",
    heart_rate: "",
    temperature: "",
    o2_saturation: "",
    chief_complaint: "",
    diagnosis: "",
    treatment_plan: ""
  });

  // FETCH DATA FROM SERVER
  const fetchData = async () => {
    setLoading(true);
    console.log("[SYSTEM] Fetching appointments and patient list...");
    try {
      const [apptRes, patientRes] = await Promise.all([
        apiFetch("/api/appointments/"),
        apiFetch("/api/patients/")
      ]);
      if (apptRes.ok) setAppointments(await apptRes.json());
      if (patientRes.ok) setPatients(await patientRes.json());
    } catch (err) {
      console.error("[FETCH ERROR]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ACTION: CREATE NEW BOOKING
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    console.log("[BOOKING] Sending request...");
    const res = await apiFetch("/api/appointments/", {
      method: "POST",
      body: JSON.stringify(newAppt)
    });

    if (res.ok) {
      console.log("[SUCCESS] Appointment scheduled.");
      setShowBookingModal(false);
      setNewAppt({ patient: "", date_time: "", reason: "" });
      fetchData();
    } else {
      const err = await res.json();
      alert("Booking failed: " + JSON.stringify(err));
    }
  };

  // ACTION: SAVE CLINICAL ENCOUNTER (Vitals)
  const handleSaveEncounter = async (e) => {
    e.preventDefault();
    console.log(`[CLINICAL] Saving encounter for Appt: ${selectedAppt.id}`);
    
    const res = await apiFetch("/api/encounters/", {
      method: "POST",
      body: JSON.stringify({
        appointment: selectedAppt.id,
        ...encounterForm
      })
    });

    if (res.ok) {
      console.log("[SUCCESS] Medical record signed and saved.");
      setShowEncounterModal(false);
      // Reset form
      setEncounterForm({
        bp_systolic: "", bp_diastolic: "", heart_rate: "",
        temperature: "", o2_saturation: "", chief_complaint: "",
        diagnosis: "", treatment_plan: ""
      });
      fetchData(); // Refresh list to show 'Completed' status
    } else {
      const errData = await res.json();
      alert("Error saving medical record: " + JSON.stringify(errData));
    }
  };

  const updateStatus = async (id, status) => {
    await apiFetch(`/api/appointments/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold"><i className="bi bi-calendar-check text-primary me-2"></i>Clinic Schedule</h2>
        <button className="btn btn-primary shadow-sm" onClick={() => setShowBookingModal(true)}>
          <i className="bi bi-plus-circle-fill me-1"></i> Book Appointment
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Patient</th>
                  <th>Date & Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th className="text-end px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appt => (
                  <tr key={appt.id}>
                    <td className="fw-bold">{appt.patient_name}</td>
                    <td className="small">{new Date(appt.date_time).toLocaleString()}</td>
                    <td className="text-muted small">{appt.reason}</td>
                    <td>
                      <span className={`badge ${
                        appt.status === 'scheduled' ? 'bg-primary' : 
                        appt.status === 'completed' ? 'bg-success' : 'bg-secondary'
                      }`}>
                        {appt.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-end px-4">
                      <div className="d-flex gap-2 justify-content-end">
                        {appt.status === 'scheduled' ? (
                          <button 
                            className="btn btn-sm btn-success d-flex align-items-center gap-1"
                            onClick={() => {
                              setSelectedAppt(appt);
                              setShowEncounterModal(true);
                            }}
                          >
                            <i className="bi bi-play-fill"></i> Start Visit
                          </button>
                        ) : (
                          <span className="badge bg-light text-dark border">Visit Logged</span>
                        )}
                        
                        <select 
                          className="form-select form-select-sm w-auto"
                          value={appt.status}
                          onChange={(e) => updateStatus(appt.id, e.target.value)}
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL 1: BOOKING --- */}
      {showBookingModal && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Schedule New Appointment</h5>
                <button className="btn-close" onClick={() => setShowBookingModal(false)}></button>
              </div>
              <form onSubmit={handleCreateBooking}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Patient</label>
                    <select className="form-select" required
                      onChange={e => setNewAppt({...newAppt, patient: e.target.value})}>
                      <option value="">Select Patient...</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Date & Time</label>
                    <input type="datetime-local" className="form-control" required
                      onChange={e => setNewAppt({...newAppt, date_time: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Reason for Visit</label>
                    <textarea className="form-control" rows="2" required
                      onChange={e => setNewAppt({...newAppt, reason: e.target.value})}></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowBookingModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Book Appointment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CLINICAL ENCOUNTER (VITALS) --- */}
      {showEncounterModal && selectedAppt && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.7)'}}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold">Clinical Encounter: {selectedAppt.patient_name}</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowEncounterModal(false)}></button>
              </div>
              <form onSubmit={handleSaveEncounter}>
                <div className="modal-body p-4">
                  
                  <h6 className="fw-bold text-uppercase text-muted small mb-3 border-bottom pb-1">Vitals Capture</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Blood Pressure</label>
                      <div className="input-group input-group-sm">
                        <input type="number" className="form-control" placeholder="Sys" required
                          onChange={e => setEncounterForm({...encounterForm, bp_systolic: e.target.value})} />
                        <span className="input-group-text">/</span>
                        <input type="number" className="form-control" placeholder="Dia" required
                          onChange={e => setEncounterForm({...encounterForm, bp_diastolic: e.target.value})} />
                      </div>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small fw-bold">HR (BPM)</label>
                      <input type="number" className="form-control form-control-sm" required
                        onChange={e => setEncounterForm({...encounterForm, heart_rate: e.target.value})} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold">Temp (°F)</label>
                      <input type="number" step="0.1" className="form-control form-control-sm" required
                        onChange={e => setEncounterForm({...encounterForm, temperature: e.target.value})} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold">O2 Sat %</label>
                      <input type="number" className="form-control form-control-sm" required
                        onChange={e => setEncounterForm({...encounterForm, o2_saturation: e.target.value})} />
                    </div>
                  </div>

                  <h6 className="fw-bold text-uppercase text-muted small mb-3 border-bottom pb-1">Clinical Observations</h6>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Chief Complaint</label>
                    <textarea className="form-control" rows="2" required placeholder="What brought the patient in?"
                      onChange={e => setEncounterForm({...encounterForm, chief_complaint: e.target.value})}></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Diagnosis</label>
                    <textarea className="form-control" rows="2" required placeholder="Clinical findings..."
                      onChange={e => setEncounterForm({...encounterForm, diagnosis: e.target.value})}></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Treatment Plan</label>
                    <textarea className="form-control" rows="2" required placeholder="Prescriptions, follow-up, etc."
                      onChange={e => setEncounterForm({...encounterForm, treatment_plan: e.target.value})}></textarea>
                  </div>

                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEncounterModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success px-4">Sign & Save Record</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
