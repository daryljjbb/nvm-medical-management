
import { Navigate } from "react-router-dom";

export default function RequireRole({ children, allowed }) {
  // Read the flat user role string saved during your successful login fetch
  const role = localStorage.getItem("role"); 

  if (!allowed.includes(role)) {
    // If an admin tries to access a user page, or user tries to access admin page, bounce them
    return <Navigate to="/dashboard" replace />; 
  }

  return children;
}

