import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import RequireAuth from "../components/RequireAuth.jsx";
import ReactQuill from "react-quill";
import { apiFetch } from "../utils/api";

export default function EditNote() {
  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("other");
  const [message, setMessage] = useState("");

  async function fetchNote() {
    const response = await apiFetch(
      `${import.meta.env.VITE_API_URL}/api/notes/${id}/`
    );

    if (!response.ok) return;

    const data = await response.json();
    setTitle(data.title);
    setContent(data.content);
    setCategory(data.category || "other");
  }

  useEffect(() => {
    fetchNote();
  }, [id]);

  async function handleSave() {
    const response = await apiFetch(
      `${import.meta.env.VITE_API_URL}/api/notes/${id}/`,
      {
        method: "PUT",
        body: JSON.stringify({
          title,
          content,
          category,
        }),
      }
    );

    if (response.ok) {
      setMessage("Note updated successfully.");
      setTimeout(() => {
        window.location.href = "/notes";
      }, 800);
    } else {
      const data = await response.json().catch(() => null);
      setMessage(data?.error || "Failed to update note.");
    }
  }

  async function handleDelete() {
    const response = await apiFetch(
      `${import.meta.env.VITE_API_URL}/api/notes/${id}/`,
      {
        method: "DELETE",
      }
    );

    if (response.ok || response.status === 204) {
      window.location.href = "/notes";
    } else {
      setMessage("Failed to delete note.");
    }
  }

  return (
    <RequireAuth>
        <div className="container">
          <h2 className="mb-3">Edit Note</h2>

          <div className="card p-4 shadow-sm">
            <input
              className="form-control my-2"
              placeholder="Note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

          

            <select
              className="form-control my-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="ideas">Ideas</option>
              <option value="urgent">Urgent</option>
              <option value="other">Other</option>
            </select>

            <button className="btn btn-primary mt-3" onClick={handleSave}>
              Save Changes
            </button>

            <button className="btn btn-danger mt-3 ms-2" onClick={handleDelete}>
              Delete Note
            </button>

            {message && (
              <p className="mt-3 text-center text-muted">{message}</p>
            )}
          </div>
        </div>
    </RequireAuth>
  );
}
