
/**
 * api.js - Centralized Fetch Wrapper
 * Handles: Base URL, Auth Headers, and Global Error Trapping
 */

// Root Cause Fix: Use an environment variable for the API URL. 
// Vite uses 'import.meta.env.VITE_API_URL'.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const url = `${BASE_URL}${endpoint}`;

  console.log(`[API CALL]: ${options.method || 'GET'} ${url}`);

  // Default headers
  const defaultHeaders = {
    "Content-Type": "application/json",
    "Authorization": token ? `Token ${token}` : "",
  };

  options.headers = { ...defaultHeaders, ...options.headers };

  try {
    const response = await fetch(url, options);

    // 401 Handling (Session Expired)
    if (response.status === 401) {
        console.warn("[AUTH] Token invalid or expired. Redirecting to login...");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/";
        return;
    }

    // 500 Handling (Server Crash)
    if (response.status >= 500) {
        console.error("[SERVER ERROR] The backend crashed or is offline.");
        throw new Error("Internal Server Error. Please try again later.");
    }

    return response;
  } catch (error) {
    console.error("[NETWORK ERROR] Failed to reach the server:", error.message);
    throw error;
  }
}
