import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiFetch } from "../utils/api.js"; // ROOT CAUSE FIX: Use our centralized wrapper
import { auth } from "../utils/auth.js";

/**
 * AdminDashboard Component
 * Provides User Management, Analytics, and CSV Export.
 */
function AdminDashboard() {
  const role = localStorage.getItem("role");

  // 1. STATE MANAGEMENT
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total_users: 0,
    admin_count: 0,
    new_users_today: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI State
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState("username");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  // Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });

  // SECURITY: Early return if not admin
  if (role !== "admin") {
    console.warn("[SECURITY] Non-admin attempted to access AdminDashboard");
    return <Navigate to="/dashboard" />;
  }

  // 2. DATA FETCHING LOGIC
  const fetchUsers = async () => {
    setLoading(true);
    console.log("[ADMIN] Fetching user directory...");
    try {
      const response = await apiFetch("/api/users/");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError("Failed to load users from server.");
      }
    } catch (err) {
      console.error("[FETCH ERROR]", err);
      setError("Network error: Could not reach the backend.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // Note: We'll use the 'stats' endpoint we defined in the backend
    try {
      const response = await apiFetch("/api/stats/");
      if (response.ok) {
        const data = await response.json();
        // Mapping mock or real stats to state
        setStats({
            total_users: users.length,
            admin_count: users.filter(u => u.role === 'admin').length,
            new_users_today: 0 // Logic for this can be added later
        });
      }
    } catch (err) {
      console.error("[STATS ERROR]", err);
    }
  };

  // 3. ACTION HANDLERS
  const updateRole = async (userId, newRole) => {
    console.log(`[ADMIN] Updating role for ${userId} to ${newRole}`);
    try {
      // Matches path: /api/users/<uuid>/update/
      const res = await apiFetch(`/api/users/${userId}/update/`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error("Failed to update role");
      
      fetchUsers(); // Refresh list
    } catch (err) {
      alert("Error updating user role: " + err.message);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("CRITICAL: Are you sure? This cannot be undone.")) return;

    try {
      const res = await apiFetch(`/api/users/${userId}/update/`, {
        method: "DELETE", // You'll need to add a DestroyAPIView or delete logic in Django later
      });

      if (res.ok) {
        console.log("[ADMIN] User deleted successfully");
        fetchUsers();
      }
    } catch (err) {
        console.error(err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    console.log("[ADMIN] Attempting to create user...");

    // ROOT CAUSE FIX: Using newUser object properties
    try {
      const response = await apiFetch("/api/create-user/", {
        method: "POST",
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        console.log("[ADMIN] User created successfully");
        setShowCreateModal(false);
        setNewUser({ username: "", email: "", password: "", role: "user" }); // Reset form
        fetchUsers();
      } else {
        const errData = await response.json();
        alert("Creation failed: " + JSON.stringify(errData));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. SORTING & FILTERING LOGIC
  const filteredUsers = users.filter((user) => {
    const term = search.toLowerCase();
    return (
      user.username.toLowerCase().includes(term) ||
      (user.email && user.email.toLowerCase().includes(term)) ||
      user.role.toLowerCase().includes(term)
    );
  }).sort((a, b) => {
    let valA = a[sortColumn] || "";
    let valB = b[sortColumn] || "";
    if (sortDirection === "asc") return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  // CSV Export Logic
  const exportCSV = () => {
    const header = ["Username", "Email", "Role"];
    const rows = users.map((u) => [u.username, u.email || "N/A", u.role]);
    const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "medical_users_export.csv";
    link.click();
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold"><i className="bi bi-shield-check text-primary"></i> Admin Control Center</h2>
        <div className="d-flex gap-2">
            <button className="btn btn-success shadow-sm" onClick={exportCSV}>
                <i className="bi bi-download"></i> Export Data
            </button>
            <button className="btn btn-primary shadow-sm" onClick={() => setShowCreateModal(true)}>
                <i className="bi bi-person-plus"></i> Add New Staff
            </button>
        </div>
      </div>

      {/* ANALYTICS ROW */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-primary text-white">
            <div className="card-body">
              <h6>Total System Users</h6>
              <h2>{users.length}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-danger text-white">
            <div className="card-body">
              <h6>Admin/Supervisors</h6>
              <h2>{users.filter(u => u.role === 'admin').length}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-info text-white">
            <div className="card-body">
              <h6>Active Sessions</h6>
              <h2>{Math.floor(users.length / 2)}</h2> {/* Mock stat */}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN TABLE CARD */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th onClick={() => setSortColumn("username")} style={{cursor:'pointer'}}>Username</th>
                  <th>Email</th>
                  <th>Role Management</th>
                  <th className="text-end px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                    <tr><td colSpan="4" className="text-center py-5">Loading directory...</td></tr>
                ) : currentUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="fw-bold">{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <select 
                        className="form-select form-select-sm w-auto"
                        value={user.role}
                        onChange={(e) => updateRole(user.id, e.target.value)}
                      >
                        <option value="user">User/Patient</option>
                        <option value="staff">Medical Staff</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td className="text-end px-4">
                      <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => {setSelectedUser(user); setShowModal(true)}}>
                        <i className="bi bi-eye"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => deleteUser(user.id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PAGINATION UI */}
      <nav className="mt-4">
        <ul className="pagination justify-content-center">
          {[...Array(totalPages)].map((_, i) => (
            <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
              <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
            </li>
          ))}
        </ul>
      </nav>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.6)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0">
              <div className="modal-header">
                <h5 className="modal-title">Provision New Account</h5>
                <button className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateUser}>
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
                        <label className="form-label">Assign Role</label>
                        <select className="form-select" value={newUser.role} 
                            onChange={e => setNewUser({...newUser, role: e.target.value})}>
                            <option value="user">User</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save User</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {showModal && selectedUser && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.6)'}}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0">
                    <div className="modal-header bg-light">
                        <h5 className="modal-title">Account Audit: {selectedUser.username}</h5>
                        <button className="btn-close" onClick={() => setShowModal(false)}></button>
                    </div>
                    <div className="modal-body">
                        <p><strong>Database ID:</strong> <span className="text-muted">{selectedUser.id}</span></p>
                        <p><strong>Email:</strong> {selectedUser.email}</p>
                        <p><strong>Role:</strong> <span className="badge bg-info">{selectedUser.role}</span></p>
                        <p><strong>System Status:</strong> <span className="text-success">Verified</span></p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
