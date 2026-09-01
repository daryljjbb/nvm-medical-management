import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [newAppt, setNewAppt] = useState({
    patient: "",
    date_time: "",
    reason: "",
    staff: localStorage.getItem("user_id") // Optional: set to current user
  });

  const fetchData = async () => {
    setLoading(true);
    const [apptRes, patientRes] = await Promise.all([
      apiFetch("/api/appointments/"),
      apiFetch("/api/patients/")
    ]);
    if (apptRes.ok) setAppointments(await apptRes.json());
    if (patientRes.ok) setPatients(await patientRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

 // pages/Appointments.jsx -> handleCreate function

const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("[APPOINTMENT] Sending booking request...");

    try {
      const res = await apiFetch("/api/appointments/", {
        method: "POST",
        body: JSON.stringify({
          patient: newAppt.patient,
          date_time: newAppt.date_time,
          reason: newAppt.reason
          // ROOT CAUSE FIX: No need to send 'staff' ID anymore
        })
      });

      if (res.ok) {
        console.log("[SUCCESS] Appointment confirmed.");
        setShowModal(false);
        fetchData(); // Refresh the table list
      } else {
        const errorData = await res.json();
        console.error("[SERVER ERROR]", errorData);
        // Display the specific error from the backend
        alert("Booking failed: " + JSON.stringify(errorData));
      }
    } catch (err) {
      console.error("[CONNECTION ERROR]", err);
    } finally {
      setLoading(false);
    }
  };  

  const updateStatus = async (id, status) => {
    await apiFetch(`/api/appointments/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  // Inside Appointments.jsx - Add a new state for the Encounter form
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

  // The Save Function
const handleSaveEncounter = async (e) => {
    e.preventDefault();
    console.log("[CLINICAL] Saving encounter and vitals...");
    
    const res = await apiFetch("/api/encounters/", {
        method: "POST",
        body: JSON.stringify({
            appointment: selectedAppt.id,
            ...encounterForm
        })
    });

    if (res.ok) {
        setShowEncounterModal(false);
        fetchData(); // Refresh table to show "Completed" status
    } else {
        alert("Error saving medical record.");
    }
};

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold"><i className="bi bi-calendar-check text-primary me-2"></i>Clinic Schedule</h2>
        <button className="btn btn-primary shadow-sm" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-circle-fill me-1"></i> Book Appointment
        </button>
      </div>

      <div className="row">
        {loading ? (
          <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
        ) : (
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Patient</th>
                      <th>Date & Time</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(appt => (
                      <tr key={appt.id}>
                        <td className="fw-bold">{appt.patient_name}</td>
                        <td>{new Date(appt.date_time).toLocaleString()}</td>
                        <td className="text-muted">{appt.reason}</td>
                        <td>
                          <span className={`badge ${
                            appt.status === 'scheduled' ? 'bg-primary' : 
                            appt.status === 'completed' ? 'bg-success' : 'bg-secondary'
                          }`}>
                            {appt.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-end">
                          <select 
                            className="form-select form-select-sm d-inline-block w-auto me-2"
                            value={appt.status}
                            onChange={(e) => updateStatus(appt.id, e.target.value)}
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      {/* Inside your .map() for appointments */}
                        <td className="text-end">
                          {appt.status === 'scheduled' ? (
                           <button 
                           className="btn btn-sm btn-success me-2" 
                           onClick={() => {
                           setSelectedAppt(appt);
                           setShowEncounterModal(true);
                            }}
                           >
                          <i className="bi bi-file-earmark-medical"></i> Start Visit
                          </button>
                           ) : (
                           <span className="text-muted small">Closed</span>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOOKING MODAL */}
      {showModal && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content border-0">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Schedule Appointment</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Select Patient</label>
                    <select className="form-select" required
                      onChange={e => setNewAppt({...newAppt, patient: e.target.value})}>
                      <option value="">Choose...</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Date & Time</label>
                    <input type="datetime-local" className="form-control" required
                      onChange={e => setNewAppt({...newAppt, date_time: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Reason for Visit</label>
                    <textarea className="form-control" rows="3" required
                      onChange={e => setNewAppt({...newAppt, reason: e.target.value})}></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Confirm Booking</button>
                </div>
                             // --- Inside the Modal JSX ---
                <div className="row g-3">
                 <div className="col-md-6">
                   <label className="form-label fw-bold small">Blood Pressure (Sys/Dia)</label>
                   <div className="input-group">
                   <input type="number" className="form-control" placeholder="120" 
                    onChange={e => setEncounterForm({...encounterForm, bp_systolic: e.target.value})} />
                    <span className="input-group-text">/</span>
                     <input type="number" className="form-control" placeholder="80" 
                      onChange={e => setEncounterForm({...encounterForm, bp_diastolic: e.target.value})} />
                  </div>
                </div>
                 <div className="col-md-3">
                   <label className="form-label fw-bold small">Heart Rate</label>
                   <input type="number" className="form-control" placeholder="BPM" 
                   onChange={e => setEncounterForm({...encounterForm, heart_rate: e.target.value})} />
                 </div>
                 <div className="col-md-3">
                   <label className="form-label fw-bold small">Temp (°F)</label>
                   <input type="number" step="0.1" className="form-control" placeholder="98.6" 
                   onChange={e => setEncounterForm({...encounterForm, temperature: e.target.value})} />
                 </div>
    
                <div className="col-12 mt-4">
                   <label className="form-label fw-bold small">Chief Complaint</label>
                   <textarea className="form-control" rows="2" required
                   onChange={e => setEncounterForm({...encounterForm, chief_complaint: e.target.value})}></textarea>
                </div>
                       {/* ... add diagnosis and treatment_plan textareas ... */}
              </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
