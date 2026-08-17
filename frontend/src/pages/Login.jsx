import { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // decode AFTER receiving the token
        const decoded = JSON.parse(atob(data.access.split(".")[1]));

        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("role", decoded.role);

        if (decoded.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/dashboard";
        }

      } else {
        setMessage(data.error || "Login failed");
      }
    } catch (error) {
      setMessage("Network error");
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
