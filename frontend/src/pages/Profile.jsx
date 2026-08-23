import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import RequireAuth from "../components/RequireAuth.jsx";
import { apiFetch } from "../utils/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);

  async function fetchProfile() {
    const response = await apiFetch(`${import.meta.env.VITE_API_URL}/api/profile/`);
    if (!response.ok) return;

    const data = await response.json();
    setProfile(data);
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  if (!profile) {
    return (
      <RequireAuth>
          <div className="container">
            <p>Loading profile...</p>
          </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
        <div className="container">
          <h2 className="mb-3">Profile</h2>
          <div className="card p-4 shadow-sm">
            <p><strong>Username:</strong> {profile.username}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            {profile.full_name && <p><strong>Full Name:</strong> {profile.full_name}</p>}
          </div>
        </div>
    </RequireAuth>
  );
}
