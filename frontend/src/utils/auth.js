export async function refreshAccessToken() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return null;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/token/refresh/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      }
    );

    if (!response.ok) {
      // Refresh token invalid/blacklisted → force logout
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.location.href = "/login";
      return null;
    }

    const data = await response.json();

    // New access token
    localStorage.setItem("access", data.access);

    // If backend returns a rotated refresh token, store it too
    if (data.refresh) {
      localStorage.setItem("refresh", data.refresh);
    }

    return data.access;
  } catch (error) {
    return null;
  }
}
