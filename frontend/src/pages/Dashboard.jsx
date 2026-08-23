import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import RequireAuth from "../components/RequireAuth.jsx";
import { apiFetch } from "../utils/api";

export default function Dashboard() {
  const [summary, setSummary] = useState({
    total_notes: 0,
    total_tasks: 0,
    completed_tasks: 0,
    recent_notes: [],
    recent_tasks: [],
  });

  async function fetchDashboard() {
    const response = await apiFetch(`${import.meta.env.VITE_API_URL}/api/dashboard/`);
    if (!response.ok) return;

    const data = await response.json();
    setSummary(data);
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  const role = localStorage.getItem("role");

if (role === "admin") {
  return <Navigate to="/admin" />;
}


  return (
    <RequireAuth>
        <div className="container">
          <h2 className="mb-3">Dashboard</h2>

          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card p-3 shadow-sm">
                <h5>Total Notes</h5>
                <p className="display-6">{summary.total_notes}</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card p-3 shadow-sm">
                <h5>Total Tasks</h5>
                <p className="display-6">{summary.total_tasks}</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card p-3 shadow-sm">
                <h5>Completed Tasks</h5>
                <p className="display-6">{summary.completed_tasks}</p>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <h4>Recent Notes</h4>
              {summary.recent_notes.length === 0 && <p>No notes yet.</p>}
              {summary.recent_notes.map((note) => (
                <div key={note.id} className="card p-3 mb-2 shadow-sm">
                  <h5>{note.title}</h5>
                  <div dangerouslySetInnerHTML={{ __html: note.content }} />
                  <small className="text-muted">
                    {new Date(note.created_at).toLocaleString()}
                  </small>
                </div>
              ))}
            </div>

            <div className="col-md-6">
              <h4>Recent Tasks</h4>
              {summary.recent_tasks.length === 0 && <p>No tasks yet.</p>}
              {summary.recent_tasks.map((task) => (
                <div key={task.id} className="card p-3 mb-2 shadow-sm">
                  <h5>{task.title}</h5>
                  <p>{task.description}</p>
                  <small className="text-muted">
                    {new Date(task.created_at).toLocaleString()}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>
    </RequireAuth>
  );
}
