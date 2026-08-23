
import { refreshAccessToken } from "./auth"; 

export async function apiFetch(url, options = {}) {
  // 1. Read the correct flat token key from storage
  const token = localStorage.getItem("token");

  // 2. Attach headers using DRF's required "Token <key>" syntax
  options.headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
    Authorization: token ? `Token ${token}` : "",
  };

  const response = await fetch(url, options);

  // 3. Handle invalid/expired tokens directly
  if (response.status === 401) {
    // Clear storage and bounce to login since DRF tokens don't rotate
    localStorage.clear();
    window.location.href = "/login";
  }

  return response;
}

