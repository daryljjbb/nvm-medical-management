import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Ensure stats is initialized as an object, not null!
const [stats, setStats] = useState({
    total_users: 0,
    admin_count: 0,
    new_users_today: 0
});

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    console.log("[ADMIN] Requesting user list...");

    try {
      // Logic: This calls /api/users/ on your Render backend
      const response = await apiFetch("/api/users/");
      
      if (response.ok) {
        const data = await response.json();
        console.log("[ADMIN] Users received:", data.length);
        setUsers(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.detail || "Unauthorized: Only Admins can view this list.");
      }
    } catch (err) {
      console.error("[ADMIN CRASH]", err);
      setError("Server connection failed. Check your Render logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter logic
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">User Management</h2>
        <button className="btn btn-primary" onClick={fetchUsers}>
            <i className="bi bi-arrow-clockwise"></i> Refresh List
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search staff by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
          <p className="mt-2 text-muted">Loading medical directory...</p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td className="fw-bold">{user.username}</td>
                      <td>{user.email || "—"}</td>
                      <td>
                        <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td><span className="text-success">● Active</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
