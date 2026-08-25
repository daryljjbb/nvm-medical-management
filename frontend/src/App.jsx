import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

// Pages
import Login from "./pages/Login.jsx";
import Logout from "./pages/Logout.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Profile from "./pages/Profile.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import Notes from "./pages/Notes.jsx";
import EditNote from "./pages/EditNote.jsx";
import Tasks from "./pages/Tasks.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Settings from "./pages/Settings.jsx";
import Patients from "./pages/Patients.jsx";
import EditPatient from "./pages/EditPatient.jsx";
import PatientDetails from "./pages/PatientDetails.jsx";

// Components
import Layout from "./components/Layout.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import RequireRole from "./components/RequireRole.jsx";

/**
 * PRIVATE WRAPPER COMPONENT
 * This wraps all protected routes to provide Layout, Auth, and Theme once.
 */
const ProtectedLayout = ({ theme, toggleTheme }) => (
  <RequireAuth>
    <Layout theme={theme} toggleTheme={toggleTheme}>
      <Outlet /> {/* This is where the specific page content renders */}
    </Layout>
  </RequireAuth>
);

function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.body.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* === PUBLIC ROUTES === */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />

        {/* === PROTECTED ROUTES (Requires Login + Layout) === */}
        <Route element={<ProtectedLayout theme={theme} toggleTheme={toggleTheme} />}>
          
          {/* General Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* User Profile Area */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/change-password" element={<ChangePassword />} />
          
          {/* Communication Area */}
          <Route path="/notes" element={<Notes />} />
          <Route path="/notes/:id/edit" element={<EditNote />} />
          
          {/* Management Area */}
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/settings" element={<Settings theme={theme} toggleTheme={toggleTheme} />} />

          {/* Patients area */}
           <Route path="/patients" element={<Patients />} />
           <Route path="/patients/:id" element={<PatientDetails />} /> {/* THE MISSING LINK */}
           <Route path="/patients/:id/edit" element={<EditPatient />} />


          {/* === ADMIN ONLY AREA === */}
          <Route element={<RequireRole allowed={["admin"]} />}>
             <Route path="/admin" element={<AdminDashboard />} />
          </Route>

        </Route>

        {/* Catch-all: Send unknown paths to Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
