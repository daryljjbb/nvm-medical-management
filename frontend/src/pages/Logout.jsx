import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../utils/auth.js"; // ROOT CAUSE FIX: Use centralized utility

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("[LOGOUT] Clearing session and redirecting...");
    
    // Wipe all medical session data
    auth.logout();

    // Redirect to login instantly
    navigate("/");
  }, [navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="text-center">
        <div className="spinner-border text-primary mb-2" role="status"></div>
        <p className="text-muted">Signing out safely...</p>
      </div>
    </div>
  );
}
