import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { RoomProvider } from "./liveblocks.config";
// Get room ID from URL (?room=test), fallback to "default-room"
const roomId =
  new URLSearchParams(window.location.search).get("room") || "default-room";
ReactDOM.createRoot(document.getElementById("root")).render(
  <RoomProvider
    id={roomId}
    initialPresence={{}}
    initialStorage={{
      code: "", // shared code state across all users
    }}
  >
    <App />
  </RoomProvider>
);
