import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../utils/api.js"; // Use our central API wrapper
import { auth } from "../utils/auth.js";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(""); // This is your state
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(""); // Clear previous errors

    console.log(`[LOGIN] Attempting login for: ${username}`);

    try {
      // ROOT CAUSE FIX: Use apiFetch to handle BASE_URL and Headers automatically
      const response = await apiFetch("/api/login/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

    if (response.ok) {
       const data = await response.json();
       localStorage.setItem("token", data.token);
       localStorage.setItem("user_id", data.user_id); // ROOT CAUSE FIX: Save the ID
       localStorage.setItem("username", data.username);
       localStorage.setItem("role", data.role);        
        // Use our central auth utility to save data
        auth.login(data.token, data.role, data.username);

        console.log("[LOGIN SUCCESS] Redirecting based on role:", data.role);
        
        if (data.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        // ROOT CAUSE FIX: Variable name must match the state 'setMessage'
        const errorData = await response.json();
        setMessage(errorData.error || "Invalid username or password");
      }
    } catch (error) {
      console.error("[LOGIN CRASH]", error);
      setMessage("Network error: Check if backend is awake (Render Free Tier)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
      <div className="card shadow-lg p-4" style={{ maxWidth: "400px", width: "100%", borderRadius: "15px" }}>
        <div className="text-center mb-4">
          <i className="bi bi-shield-lock-fill text-primary" style={{ fontSize: "3rem" }}></i>
          <h2 className="fw-bold">Medical Portal</h2>
          <p className="text-muted">Please sign in to continue</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              className="form-control"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              className="form-control"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            className="btn btn-primary w-100 py-2 fw-bold" 
            type="submit"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="small mb-0">Don't have an account?</p>
          <Link to="/register" className="text-decoration-none">Contact Administrator</Link>
        </div>

        {message && (
          <div className="alert alert-danger mt-3 py-2 small text-center border-0">
            <i className="bi bi-exclamation-circle-fill me-2"></i>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
