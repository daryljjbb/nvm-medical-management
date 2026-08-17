export default function RequireAuth({ children }) {
  const access = localStorage.getItem("access");

  if (!access) {
    window.location.href = "/";
    return null;
  }

  return children;
}
