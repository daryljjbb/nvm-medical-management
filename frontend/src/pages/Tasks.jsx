import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import RequireAuth from "../components/RequireAuth.jsx";
import { apiFetch } from "../utils/api";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  async function fetchTasks() {
    const response = await apiFetch(`${import.meta.env.VITE_API_URL}/api/tasks/`);
    if (!response.ok) return;

    const data = await response.json();
    setTasks(data);
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  async function handleAddTask() {
    const response = await apiFetch(`${import.meta.env.VITE_API_URL}/api/tasks/`, {
      method: "POST",
      body: JSON.stringify({ title, description }),
    });

    if (response.ok) {
      setTitle("");
      setDescription("");
      fetchTasks();
    }
  }

  async function handleToggleComplete(id) {
    const response = await apiFetch(`${import.meta.env.VITE_API_URL}/api/tasks/${id}/toggle/`, {
      method: "POST",
    });

    if (response.ok) {
      fetchTasks();
    }
  }

  async function handleDeleteTask(id) {
    const response = await apiFetch(`${import.meta.env.VITE_API_URL}/api/tasks/${id}/`, {
      method: "DELETE",
    });

    if (response.ok || response.status === 204) {
      setTasks(tasks.filter((task) => task.id !== id));
    }
  }

  return (
    <RequireAuth>
        <div className="container">
          <h2 className="mb-3">Tasks</h2>

          <div className="card p-4 mb-4 shadow-sm">
            <input
              className="form-control my-2"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="form-control my-2"
              placeholder="Task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button className="btn btn-primary mt-2" onClick={handleAddTask}>
              Add Task
            </button>
          </div>

          {tasks.map((task) => (
            <div key={task.id} className="card p-3 mb-3 shadow-sm">
              <h5>{task.title}</h5>
              <p>{task.description}</p>
              <span
                className={
                  task.completed ? "badge bg-success mb-2" : "badge bg-secondary mb-2"
                }
              >
                {task.completed ? "Completed" : "Pending"}
              </span>
              <div className="mt-2">
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => handleToggleComplete(task.id)}
                >
                  {task.completed ? "Mark as Pending" : "Mark as Completed"}
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
    </RequireAuth>
  );
}
