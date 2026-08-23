
import { Navigate, useLocation } from "react-router-dom";

/**
 * RequireAuth - The Primary Gatekeeper
 * Ensures the user has a valid session token before showing any protected UI.
 */
export default function RequireAuth({ children }) {
  const token = localStorage.getItem("token"); 
  const location = useLocation(); // Keeps track of where the user was trying to go

  if (!token) {
    console.warn(`[AUTH GUARD] Unauthorized access attempt to ${location.pathname}. Redirecting to Login.`);
    // 'replace' prevents the user from clicking "back" into a protected page
    return <Navigate to="/" state={{ from: location }} replace />; 
  }

  console.log(`[AUTH GUARD] Token verified for ${location.pathname}. Access GRANTED.`);
  return children;
}
