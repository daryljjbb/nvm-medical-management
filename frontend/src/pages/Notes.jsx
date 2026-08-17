import { useEffect, useState } from "react";
import RequireAuth from "../components/RequireAuth.jsx";
import { apiFetch } from "../utils/api";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("other");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Drag state
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  async function fetchNotes() {
    const response = await apiFetch(`${import.meta.env.VITE_API_URL}/api/notes/`);
    if (!response.ok) return;

    const data = await response.json();

    // Ensure pinned exists (frontend only)
    const withPinned = data.map((n) => ({
      ...n,
      pinned: n.pinned ?? false,
    }));

    setNotes(withPinned);
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  async function handleAddNote() {
    const response = await apiFetch(`${import.meta.env.VITE_API_URL}/api/notes/`, {
      method: "POST",
      body: JSON.stringify({ title, content, category }),
    });

    if (response.ok) {
      const newNote = await response.json();
      newNote.pinned = false; // default

      setNotes([newNote, ...notes]);
      setTitle("");
      setContent("");
      setCategoryFilter(""); // show all categories
    }
  }

  async function handleDeleteNote(id) {
    const response = await apiFetch(`${import.meta.env.VITE_API_URL}/api/notes/${id}/`, {
      method: "DELETE",
    });

    if (response.ok || response.status === 204) {
      setNotes(notes.filter((note) => note.id !== id));
    }
  }

  function togglePin(id) {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, pinned: !note.pinned } : note
      )
    );
  }

  function autoScroll(e) {
  const scrollMargin = 80; // px from top/bottom to trigger scroll
  const scrollSpeed = 12;  // px per frame

  const y = e.clientY;
  const windowHeight = window.innerHeight;

  if (y < scrollMargin) {
    window.scrollBy(0, -scrollSpeed);
  } else if (y > windowHeight - scrollMargin) {
    window.scrollBy(0, scrollSpeed);
  }
}


function handleDragStart(e, id, title) {
  setDraggingId(id);

  const preview = document.getElementById("drag-preview");

  preview.innerHTML = `
    <strong>${title}</strong>
    <div style="font-size:12px; color:#666;">Dragging note...</div>
  `;

  const img = new Image();
  img.src =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2NkYGD4DwABBAEAffO3WQAAAABJRU5ErkJggg==";

  e.dataTransfer.setDragImage(preview, 0, 0);
}




  function handleDragOver(id, isPinnedGroup) {
    if (!draggingId || draggingId === id) return;

    const updated = [...notes];

    // Only reorder inside the same group (pinned or unpinned)
    const draggingNote = updated.find((n) => n.id === draggingId);
    const targetNote = updated.find((n) => n.id === id);

    if (!draggingNote || !targetNote) return;
    if (draggingNote.pinned !== targetNote.pinned) return;

    const fromIndex = updated.findIndex((n) => n.id === draggingId);
    const toIndex = updated.findIndex((n) => n.id === id);

    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    setNotes(updated);
    setDragOverId(id);
  }

  function handleDragEnd() {
  const card = document.querySelector(`[data-id="${draggingId}"]`);
  if (card) {
    card.classList.add("drop-bounce");
    setTimeout(() => card.classList.remove("drop-bounce"), 200);
  }

  setDraggingId(null);
  setDragOverId(null);
}


  // Filter notes
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.content.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "" || note.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Split into pinned and unpinned groups
  const pinnedNotes = filteredNotes.filter((n) => n.pinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.pinned);

  return (
    <RequireAuth>
      <div className="container">
        <h2 className="mb-3">My Notes</h2>

        {/* Search */}
        <input
          className="form-control mb-4"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Category Filter */}
        <select
          className="form-control mb-4"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="ideas">Ideas</option>
          <option value="urgent">Urgent</option>
          <option value="other">Other</option>
        </select>

        {/* Add Note Form */}
        <div className="card p-4 mb-4 shadow-sm">
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

          <button className="btn btn-primary mt-2" onClick={handleAddNote}>
            Add Note
          </button>
        </div>

        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <h4 className="mt-4 mb-2">Pinned</h4>
        )}

        {pinnedNotes.map((note) => (
         <div
                key={note.id}
                data-id={note.id}
                className={`note-card card p-3 mb-3 shadow-sm ${
                  draggingId === note.id ? "dragging" : ""
                } ${dragOverId === note.id ? "drag-over" : ""}`}
                draggable
                onDragStart={(e) => handleDragStart(e,note.id, note.title)}
                onDragOver={(e) => {
                  e.preventDefault();
                  autoScroll(e);
                  handleDragOver(note.id, note.pinned);
                }}
                onDragEnd={handleDragEnd}
        >


            <div className="d-flex justify-content-between align-items-start">
              <h5 className="mb-1">{note.title}</h5>
              <span style={{ cursor: "grab" }} className="text-muted">⋮⋮</span>
            </div>

            <span className="badge bg-warning text-dark mb-2">Pinned</span>

            <div dangerouslySetInnerHTML={{ __html: note.content }} />

            <span
              className={`badge mb-2 ${
                note.category === "work"
                  ? "bg-primary"
                  : note.category === "personal"
                  ? "bg-success"
                  : note.category === "ideas"
                  ? "bg-purple"
                  : note.category === "urgent"
                  ? "bg-danger"
                  : "bg-secondary"
              }`}
            >
              {note.category}
            </span>

            <small className="text-muted d-block mb-2">
              Created: {new Date(note.created_at).toLocaleString()}
            </small>

            <button
              className="btn btn-sm btn-warning mt-2 me-2"
              onClick={() => togglePin(note.id)}
            >
              Unpin
            </button>

            <a
              href={`/notes/${note.id}/edit`}
              className="btn btn-sm btn-secondary mt-2 me-2"
            >
              Edit
            </a>

            <button
              className="btn btn-sm btn-danger mt-2"
              onClick={() => handleDeleteNote(note.id)}
            >
              Delete
            </button>
          </div>
        ))}

        {/* Unpinned Notes */}
        {unpinnedNotes.length > 0 && (
          <h4 className="mt-4 mb-2">Notes</h4>
        )}

        {unpinnedNotes.map((note) => (
          <div
            key={note.id}
            className={`card p-3 mb-3 shadow-sm ${
              dragOverId === note.id ? "border border-primary" : ""
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e,note.id, note.title)}
            onDragOver={(e) => {
              e.preventDefault();
              autoScroll(e);
              handleDragOver(note.id, false);
            }}
            onDragEnd={handleDragEnd}
          >
            <div className="d-flex justify-content-between align-items-start">
              <h5 className="mb-1">{note.title}</h5>
              <span style={{ cursor: "grab" }} className="text-muted">⋮⋮</span>
            </div>

            <div dangerouslySetInnerHTML={{ __html: note.content }} />

            <span
              className={`badge mb-2 ${
                note.category === "work"
                  ? "bg-primary"
                  : note.category === "personal"
                  ? "bg-success"
                  : note.category === "ideas"
                  ? "bg-purple"
                  : note.category === "urgent"
                  ? "bg-danger"
                  : "bg-secondary"
              }`}
            >
              {note.category}
            </span>

            <small className="text-muted d-block mb-2">
              Created: {new Date(note.created_at).toLocaleString()}
            </small>

            <button
              className="btn btn-sm btn-outline-warning mt-2 me-2"
              onClick={() => togglePin(note.id)}
            >
              Pin
            </button>

            <a
              href={`/notes/${note.id}/edit`}
              className="btn btn-sm btn-secondary mt-2 me-2"
            >
              Edit
            </a>

            <button
              className="btn btn-sm btn-danger mt-2"
              onClick={() => handleDeleteNote(note.id)}
            >
              Delete
            </button>
          </div>
        ))}
        <div id="drag-preview" style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          padding: "10px",
          background: "white",
          borderRadius: "6px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          fontSize: "14px",
          width: "200px"
        }}>
          Dragging...
        </div>

      </div>
    </RequireAuth>
  );
}
