
import { Navigate } from "react-router-dom";

export default function RequireAuth({ children }) {
  // ❌ Change from localStorage.getItem("access")
  const token = localStorage.getItem("token"); 

  if (!token) {
    // If no token is found, user goes back to the login screen
    return <Navigate to="/" replace />; 
  }

  return children;
}

