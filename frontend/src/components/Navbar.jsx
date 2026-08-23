export default function Navbar() {
  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.href = "/";
  };

  return (
    <nav className="navbar navbar-dark bg-dark px-3">
      <span className="navbar-brand mb-0 h1">Simple Login App</span>

      <div>
        <a href="/dashboard" className="btn btn-outline-light me-2">
            Dashboard
        </a>

        <a href="/profile" className="btn btn-outline-light me-2">
            Profile
        </a>
        <a href="/edit-profile" className="btn btn-outline-light me-2">
        Edit Profile
        </a>

        <a href="/change-password" className="btn btn-outline-light me-2">
        Change Password
        </a>
        <a href="/notes" className="btn btn-outline-light me-2">
        Notes
        </a>
        <a href="/tasks" className="btn btn-outline-light me-2">
        Tasks
        </a>


        <button className="btn btn-danger" onClick={handleLogout}>
            Logout
        </button>
        </div>

    </nav>
  );
}
