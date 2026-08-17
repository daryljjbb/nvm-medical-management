export default function RequireRole({ allowed, children }) {
  const role = localStorage.getItem("role");

  if (!role || !allowed.includes(role)) {
    return (window.location.href = "/dashboard");
  }

  return children;
}
