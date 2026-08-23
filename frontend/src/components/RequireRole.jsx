
import { Navigate, Outlet } from "react-router-dom";

/**
 * RequireRole - The Security Bouncer
 * This version supports the "Nested Route" pattern using <Outlet />
 */
export default function RequireRole({ children, allowed }) {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  console.log(`[ROLE GUARD] User: ${role} | Required: ${allowed}`);

  // 1. If not logged in at all
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 2. If role is not allowed
  if (!allowed.includes(role)) {
    console.error("[ROLE GUARD] Access Denied. Redirecting...");
    return <Navigate to="/dashboard" replace />;
  }

  // 3. ROOT CAUSE FIX: 
  // If we have 'children', render them. 
  // If not, render the <Outlet /> (the child route from App.jsx)
  console.log("[ROLE GUARD] Access Granted.");
  return children ? children : <Outlet />;
}
