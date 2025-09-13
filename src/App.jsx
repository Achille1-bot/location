// src/App.jsx
import { useState } from "react";
import Home from "./pages/Home";
import RoomDetail from "./pages/RoomDetail";

export default function App() {
  const [route, setRoute] = useState(window.location.pathname);
  const navigate = (to) => { window.history.pushState({}, "", to); setRoute(to); };
  window.onpopstate = () => setRoute(window.location.pathname);

  if (route.startsWith("/room/")) {
    const roomId = route.split("/room/")[1];
    return <RoomDetail roomId={roomId} />;
  }
  return <Home navigate={navigate} />;
}