import { useState } from "react";
import Layout from "../components/Layout.jsx";
import RequireAuth from "../components/RequireAuth.jsx";
import { apiFetch } from "../utils/api";

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleChangePassword() {
    const response = await apiFetch(
      `${import.meta.env.VITE_API_URL}/api/change-password/`,
      {
        method: "POST",
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      }
    );

    if (response.ok) {
      setMessage("Password changed successfully.");
      setOldPassword("");
      setNewPassword("");
    } else {
      const data = await response.json().catch(() => null);
      setMessage(data?.error || "Failed to change password.");
    }
  }

  return (
    <RequireAuth>
        <div className="container">
          <h2 className="mb-3">Change Password</h2>

          <div className="card p-4 shadow-sm">
            <input
              className="form-control my-2"
              type="password"
              placeholder="Current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <input
              className="form-control my-2"
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              className="btn btn-primary mt-2"
              onClick={handleChangePassword}
            >
              Change Password
            </button>
            {message && (
              <p className="mt-3 text-center text-muted">{message}</p>
            )}
          </div>
        </div>
    </RequireAuth>
  );
}
