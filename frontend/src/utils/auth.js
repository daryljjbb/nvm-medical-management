
export async function refreshAccessToken() {
  // Pull the flat token your login view created
  const token = localStorage.getItem("token");
  if (!token) return null;
  
  // Return it immediately to your API requests
  return token; 
}

