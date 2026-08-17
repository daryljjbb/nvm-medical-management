import { useState,useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Logout from "./pages/Logout.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Profile from "./pages/Profile.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import Notes from "./pages/Notes.jsx"
import EditNote from "./pages/EditNote.jsx";
import Tasks from "./pages/Tasks.jsx";
import RequireRole from "./components/RequireRole.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import Layout from "./components/Layout.jsx";
import Settings from "./pages/Settings.jsx";




function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.body.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <BrowserRouter>
      <Routes>

        {/* Public pages (NO Layout) */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />

        {/* Protected pages (WITH Layout) */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Layout theme={theme} toggleTheme={toggleTheme}>
                <Dashboard />
              </Layout>
            </RequireAuth>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireRole allowed={["admin"]}>
                <Layout theme={theme} toggleTheme={toggleTheme}>
                  <AdminDashboard />
                </Layout>
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Layout theme={theme} toggleTheme={toggleTheme}>
                <Profile />
              </Layout>
            </RequireAuth>
          }
        />

        <Route
          path="/edit-profile"
          element={
            <RequireAuth>
              <Layout theme={theme} toggleTheme={toggleTheme}>
                <EditProfile />
              </Layout>
            </RequireAuth>
          }
        />

        <Route
          path="/change-password"
          element={
            <RequireAuth>
              <Layout theme={theme} toggleTheme={toggleTheme}>
                <ChangePassword />
              </Layout>
            </RequireAuth>
          }
        />

        <Route
          path="/notes"
          element={
            <RequireAuth>
              <Layout theme={theme} toggleTheme={toggleTheme}>
                <Notes />
              </Layout>
            </RequireAuth>
          }
        />

        <Route
          path="/notes/:id/edit"
          element={
            <RequireAuth>
              <Layout theme={theme} toggleTheme={toggleTheme}>
                <EditNote />
              </Layout>
            </RequireAuth>
          }
        />

        <Route
          path="/tasks"
          element={
            <RequireAuth>
              <Layout theme={theme} toggleTheme={toggleTheme}>
                <Tasks />
              </Layout>
            </RequireAuth>
          }
        />

        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Layout theme={theme} toggleTheme={toggleTheme}>
                <Settings theme={theme} toggleTheme={toggleTheme} />
              </Layout>
            </RequireAuth>
          }
        />


      </Routes>
    </BrowserRouter>
  );
}


export default App
