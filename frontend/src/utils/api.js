import { refreshAccessToken } from "./auth";

export async function apiFetch(url, options = {}) {
  let access = localStorage.getItem("access");

  options.headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${access}`,
    "Content-Type": "application/json",
  };

  let response = await fetch(url, options);

  if (response.status === 401) {
    const newAccess = await refreshAccessToken();

    if (!newAccess) return response;

    // FIX: store new token so future requests use it
    localStorage.setItem("access", newAccess);

    options.headers.Authorization = `Bearer ${newAccess}`;
    response = await fetch(url, options);
  }

  return response;
}
