// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MyNavbar from "./components/MyNavbar";
import Home from "./pages/Home";
import RoomDetail from "./pages/RoomDetail";
import AdminAddRoom from "./pages/AdminAddRoom";

export default function App() {
  return (
    <BrowserRouter>
      <MyNavbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:id" element={<RoomDetail />} />
          <Route path="/admin" element={<AdminAddRoom />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<div className="text-muted">Page introuvable.</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
