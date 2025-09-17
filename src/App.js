// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MyNavbar from "./components/MyNavbar";

// Public
import Home from "./pages/Home";
import RoomDetail from "./pages/RoomDetail";   // OK (default)

// Admin
import AdminLogin from "./pages/AdminLogin";
import AdminRooms from "./pages/AdminRooms";
import AdminEditRoom from "./pages/AdminEditRoom";
import RequireAuth from "./components/RequireAuth";
import DemandeDetail from "./pages/DemandeDetail"; // OK (default)
export default function App() {
  return (
    <BrowserRouter>
      <MyNavbar />
      <div className="container mt-4">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/room/:id" element={<RoomDetail />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/demande/:id" element={<DemandeDetail />} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <RequireAuth fallback={<AdminLogin />}>
                <AdminRooms />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/new"
            element={
              <RequireAuth fallback={<AdminLogin />}>
                <AdminEditRoom />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/edit/:id"
            element={
              <RequireAuth fallback={<AdminLogin />}>
                <AdminEditRoom />
              </RequireAuth>
            }
          />

          {/* 404 */}
          <Route path="*" element={<div className="text-muted">Page introuvable.</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
