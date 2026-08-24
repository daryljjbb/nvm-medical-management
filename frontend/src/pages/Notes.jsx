import React, { useEffect, useState } from "react";
import { apiFetch } from "../api";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newNote, setNewNote] = useState({ receiver: "", content: "" });
  const [users, setUsers] = useState([]); // For the "Recipient" dropdown

  // Load notes and the list of possible recipients (staff)
  const loadData = async () => {
    setLoading(true);
    try {
      const [notesRes, usersRes] = await Promise.all([
        apiFetch("/api/notes/"),
        apiFetch("/api/users/")
      ]);
      
      if (notesRes.ok) setNotes(await notesRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (err) {
      console.error("[NOTES FETCH ERROR]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    const res = await apiFetch("/api/notes/", {
      method: "POST",
      body: JSON.stringify(newNote)
    });
    if (res.ok) {
      setShowCreate(false);
      setNewNote({ receiver: "", content: "" });
      loadData(); // Refresh list
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold"><i className="bi bi-journal-medical text-primary"></i> Clinical Notes</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <i className="bi bi-plus-lg"></i> New Record
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border"></div></div>
      ) : (
        <div className="row">
          {notes.map(note => (
            <div key={note.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="badge bg-secondary-subtle text-secondary">
                      From: {note.sender_name}
                    </span>
                    <small className="text-muted">{note.formatted_date}</small>
                  </div>
                  <h6 className="fw-bold">To: {note.receiver_name}</h6>
                  <p className="card-text text-dark">{note.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE NOTE MODAL */}
      {showCreate && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content border-0">
              <div className="modal-header">
                <h5 className="modal-title">New Clinical Entry</h5>
                <button className="btn-close" onClick={() => setShowCreate(false)}></button>
              </div>
              <form onSubmit={handleSend}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Recipient (Staff/Doctor)</label>
                    <select className="form-select" required
                      value={newNote.receiver} onChange={e => setNewNote({...newNote, receiver: e.target.value})}>
                      <option value="">Select Recipient...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Note Content</label>
                    <textarea className="form-control" rows="5" required
                      value={newNote.content} onChange={e => setNewNote({...newNote, content: e.target.value})}
                      placeholder="Enter clinical observations or messages..."></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Record</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
