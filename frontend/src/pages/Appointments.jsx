import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showEncounterModal, setShowEncounterModal] = useState(false);

  // Forms
  const [newAppt, setNewAppt] = useState({ patient: "", date_time: "", reason: "" });
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [encounterForm, setEncounterForm] = useState({
    bp_systolic: "", bp_diastolic: "", heart_rate: "",
    temperature: "", o2_saturation: "", chief_complaint: "",
    diagnosis: "", treatment_plan: ""
  });

  const fetchData = async () => {
    setLoading(true);
    console.log("--- [DEBUG] Fetching Appointments and Patients ---");
    
    try {
      const [apptRes, patientRes] = await Promise.all([
        apiFetch("/api/appointments/"),
        apiFetch("/api/patients/")
      ]);

      if (apptRes.ok) {
        const apptData = await apptRes.json();
        console.log("[DEBUG] Appointments received:");
        console.table(apptData);
        setAppointments(apptData);
      } else {
        console.error(`[DEBUG] Appointments API Failed: ${apptRes.status}`);
      }

      if (patientRes.ok) {
        const patientData = await patientRes.json();
        console.log("[DEBUG] Patients received for dropdown:");
        console.table(patientData); // This will show you exactly what's in the list
        setPatients(patientData);
      } else {
        console.error(`[DEBUG] Patients API Failed: ${patientRes.status}`);
      }
    } catch (err) {
      console.error("[CRITICAL FETCH ERROR]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!newAppt.patient) return alert("Please select a patient first!");

    const res = await apiFetch("/api/appointments/", {
      method: "POST",
      body: JSON.stringify(newAppt)
    });

    if (res.ok) {
      setShowBookingModal(false);
      setNewAppt({ patient: "", date_time: "", reason: "" });
      fetchData();
    } else {
      const err = await res.json();
      alert("Booking Error: " + JSON.stringify(err));
    }
  };

  const handleSaveEncounter = async (e) => {
    e.preventDefault();
    const res = await apiFetch("/api/encounters/", {
      method: "POST",
      body: JSON.stringify({ appointment: selectedAppt.id, ...encounterForm })
    });
    if (res.ok) {
      setShowEncounterModal(false);
      fetchData();
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold"><i className="bi bi-calendar-check text-primary me-2"></i>Clinic Schedule</h2>
        <button className="btn btn-primary" onClick={() => setShowBookingModal(true)}>
          <i className="bi bi-plus-circle-fill"></i> Book Appointment
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
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length > 0 ? (
                  appointments.map(appt => (
                    <tr key={appt.id}>
                      <td className="fw-bold">{appt.patient_name}</td>
                      <td>{new Date(appt.date_time).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${appt.status === 'scheduled' ? 'bg-primary' : 'bg-success'}`}>
                          {appt.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-end">
                        {appt.status === 'scheduled' && (
                          <button className="btn btn-sm btn-success" onClick={() => { setSelectedAppt(appt); setShowEncounterModal(true); }}>
                            Start Visit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="text-center py-4 text-muted">No appointments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {showBookingModal && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content border-0">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Schedule Appointment</h5>
                <button className="btn-close" onClick={() => setShowBookingModal(false)}></button>
              </div>
              <form onSubmit={handleCreateBooking}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Select Patient</label>
                    <select className="form-select" required
                      value={newAppt.patient}
                      onChange={e => setNewAppt({...newAppt, patient: e.target.value})}>
                      <option value="">Choose a registered patient...</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                      ))}
                    </select>
                    {patients.length === 0 && (
                      <div className="form-text text-danger">
                        <i className="bi bi-exclamation-triangle"></i> No patients found in database. 
                        Go to "Patients" tab to register one first.
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Date & Time</label>
                    <input type="datetime-local" className="form-control" required
                      onChange={e => setNewAppt({...newAppt, date_time: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Reason</label>
                    <textarea className="form-control" required
                      onChange={e => setNewAppt({...newAppt, reason: e.target.value})}></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowBookingModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={patients.length === 0}>Book Appointment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ENCOUNTER MODAL (Vitals) */}
      {showEncounterModal && selectedAppt && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.7)'}}>
          {/* ... [Rest of your encounter modal code from previous step] ... */}
        </div>
      )}
    </div>
  );
}
