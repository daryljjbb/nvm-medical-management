import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
const navigate = useNavigate();



const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("role", data.role);

      // 🚀 Route instantly without breaking the SPA!
      if (data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      } // Removed the stray bracket that was breaking things here!
    } else {
      setErrorMessage("Invalid credentials");
    }
  } catch (error) {
    setErrorMessage("Network error");
  }
};
     
  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <h2 className="mb-4 text-center">Login</h2>

      <input
        className="form-control my-2"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        className="form-control my-2"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="btn btn-primary w-100 mt-3" onClick={handleLogin}>
        Login
      </button>

      <a href="/register" className="mt-3 d-block text-center">
        Create an account
      </a>

      {message && <p className="mt-3 text-center text-danger">{message}</p>}
    </div>
  );
}
