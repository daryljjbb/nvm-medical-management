import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import RequireAuth from "../components/RequireAuth.jsx";
import { apiFetch } from "../utils/api";

export default function EditProfile() {
  const [profile, setProfile] = useState({ full_name: "", email: "" });
  const [message, setMessage] = useState("");

  async function fetchProfile() {
    const response = await apiFetch(`${import.meta.env.VITE_API_URL}/api/profile/`);
    if (!response.ok) return;

    const data = await response.json();
    setProfile({
      full_name: data.full_name || "",
      email: data.email || "",
    });
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  async function handleSave() {
    const response = await apiFetch(`${import.meta.env.VITE_API_URL}/api/profile/`, {
      method: "PUT",
      body: JSON.stringify(profile),
    });

    if (response.ok) {
      setMessage("Profile updated successfully.");
    } else {
      setMessage("Failed to update profile.");
    }
  }

  return (
    <RequireAuth>
        <div className="container">
          <h2 className="mb-3">Edit Profile</h2>

          <div className="card p-4 shadow-sm">
            <input
              className="form-control my-2"
              placeholder="Full name"
              value={profile.full_name}
              onChange={(e) =>
                setProfile({ ...profile, full_name: e.target.value })
              }
            />
            <input
              className="form-control my-2"
              placeholder="Email"
              value={profile.email}
              onChange={(e) =>
                setProfile({ ...profile, email: e.target.value })
              }
            />
            <button className="btn btn-primary mt-2" onClick={handleSave}>
              Save Changes
            </button>
            {message && (
              <p className="mt-3 text-center text-muted">{message}</p>
            )}
          </div>
        </div>
    </RequireAuth>
  );
}
