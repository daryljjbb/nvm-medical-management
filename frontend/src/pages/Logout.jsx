import { useEffect } from "react";

export default function Logout() {
  useEffect(() => {
    // Clear stored tokens
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    // Redirect to login page
    window.location.href = "/";
  }, []);

  return null; // No UI needed
}
