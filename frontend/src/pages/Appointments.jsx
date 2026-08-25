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
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
