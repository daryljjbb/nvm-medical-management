import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js"; 

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", role: "user" });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/users/");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("[ADMIN FETCH ERROR]", err);
      setError("Failed to load user list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // --- ACTION: UPDATE ROLE ---
  const handleRoleChange = async (userId, newRole) => {
    console.log(`[ADMIN] Changing user ${userId} to ${newRole}`);
    try {
      const res = await apiFetch(`/api/users/${userId}/update/`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) fetchUsers(); // Refresh the list to show new role
    } catch (err) { alert("Failed to update role"); }
  };

  // --- ACTION: DELETE USER ---
  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure? This user will lose all medical access.")) return;
    
    try {
      const res = await apiFetch(`/api/users/${userId}/update/`, { method: "DELETE" });
      if (res.ok) {
        console.log("[ADMIN] User deleted successfully");
        fetchUsers();
      }
    } catch (err) { console.error(err); }
  };

  // --- ACTION: CREATE USER ---
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/create-user/", {
        method: "POST",
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewUser({ username: "", email: "", password: "", role: "user" });
        fetchUsers();
      } else {
        alert("Check if username/email already exists.");
      }
    } catch (err) { console.error(err); }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold"><i className="bi bi-people-fill me-2"></i>User Management</h2>
        <button className="btn btn-primary shadow-sm" onClick={() => setShowCreateModal(true)}>
          <i className="bi bi-person-plus-fill me-1"></i> Add New User
        </button>
      </div>

      {/* SEARCH CARD */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body">
          <input type="text" className="form-control" placeholder="Search staff or patients..." 
                 value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : (
        <div className="card border-0 shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role Control</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td className="fw-bold">{user.username}</td>
                    <td className="text-muted">{user.email || "—"}</td>
                    <td>
                      <select 
                        className={`form-select form-select-sm w-auto ${user.role === 'admin' ? 'border-danger' : ''}`}
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      >
                        <option value="user">User</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-danger border-0" onClick={() => handleDelete(user.id)}>
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Provision New Account</h5>
                <button className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input type="text" className="form-control" required 
                           value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" 
                           value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Temporary Password</label>
                    <input type="password" name="password" className="form-control" required
                           value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                      <option value="user">User</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Account</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
