import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";
import { Link } from "react-router-dom";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    first_name: "", last_name: "", date_of_birth: "",
    gender: "M", blood_group: "UNK", emergency_contact_name: "",
    emergency_contact_phone: ""
  });

  const fetchPatients = async () => {
    setLoading(true);
    console.log("[PATIENTS] Loading medical directory...");
    const res = await apiFetch("/api/patients/");
    if (res.ok) setPatients(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await apiFetch("/api/patients/", {
      method: "POST",
      body: JSON.stringify(newPatient)
    });
    if (res.ok) {
      setShowModal(false);
      fetchPatients();
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold"><i className="bi bi-person-lines-fill text-primary"></i> Patient Directory</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
           <i className="bi bi-person-plus-fill"></i> Register New Patient
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>DOB</th>
                <th>Gender</th>
                <th>Blood Type</th>
                <th>Emergency Contact</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id}>
                  <td className="fw-bold">{p.first_name} {p.last_name}</td>
                  <td>{p.date_of_birth}</td>
                  <td>{p.gender}</td>
                  <td><span className="badge bg-danger-subtle text-danger">{p.blood_group}</span></td>
                  <td>{p.emergency_contact_name} ({p.emergency_contact_phone})</td>
                  <td className="text-end">
                    <Link to={`/patients/${p.id}`} className="btn btn-sm btn-outline-primary">
                      View Records
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTRATION MODAL */}
      {showModal && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.6)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">New Patient Intake</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">First Name</label>
                      <input type="text" className="form-control" required
                        onChange={e => setNewPatient({...newPatient, first_name: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Last Name</label>
                      <input type="text" className="form-control" required
                        onChange={e => setNewPatient({...newPatient, last_name: e.target.value})} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Date of Birth</label>
                      <input type="date" className="form-control" required
                        onChange={e => setNewPatient({...newPatient, date_of_birth: e.target.value})} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Gender</label>
                      <select className="form-select" onChange={e => setNewPatient({...newPatient, gender: e.target.value})}>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Blood Group</label>
                      <select className="form-select" onChange={e => setNewPatient({...newPatient, blood_group: e.target.value})}>
                        <option value="UNK">Unknown</option>
                        <option value="A+">A+</option>
                        <option value="O+">O+</option>
                        {/* Add more as needed */}
                      </select>
                    </div>
                    <div className="col-12 mt-4"><h6 className="fw-bold border-bottom pb-2">Emergency Contact</h6></div>
                    <div className="col-md-6">
                      <label className="form-label">Contact Name</label>
                      <input type="text" className="form-control" required
                        onChange={e => setNewPatient({...newPatient, emergency_contact_name: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Contact Phone</label>
                      <input type="text" className="form-control" required
                        onChange={e => setNewPatient({...newPatient, emergency_contact_phone: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4">Save Patient File</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
