import { useState, useEffect } from "react";

export default function Settings({ theme, toggleTheme }) {
  const token = localStorage.getItem("access");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedEmail = localStorage.getItem("email");

    if (storedUsername) setUsername(storedUsername);
    if (storedEmail) setEmail(storedEmail);
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch(
        "https://simple-login-backend-f88m.onrender.com/api/update-profile/",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username, email }),
        }
      );

      if (!res.ok) {
        alert("Failed to update profile");
        return;
      }

      localStorage.setItem("username", username);
      localStorage.setItem("email", email);

      alert("Settings updated successfully");
    } catch (err) {
      alert("Error updating settings");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="fw-bold mb-4">
        <i className="bi bi-gear-wide-connected me-2"></i>
        Settings
      </h2>

      <div className="card p-4 shadow-sm">

        <div className="mb-3">
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Theme</label>
          <button
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            onClick={toggleTheme}
          >
            {theme === "light" ? (
              <>
                <i className="bi bi-moon-fill"></i> Switch to Dark Mode
              </>
            ) : (
              <>
                <i className="bi bi-sun-fill"></i> Switch to Light Mode
              </>
            )}
          </button>
        </div>

        <button className="btn btn-primary" onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
