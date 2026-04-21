import React, { useMemo } from "react";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { RoomProvider } from "./liveblocks.config";
import Editor from "./components/Editor";
import { getRandomColor, getRandomName } from "./utils/presence";
import JoinRoom from "./pages/JoinRoom";
import { useNavigate } from "react-router-dom";

// 🔹 Wrapper for room
function RoomWrapper() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const username = sessionStorage.getItem("username");

  // 🚨 If no username → redirect to join page
  React.useEffect(() => {
    if (!username) {
      navigate(`/room/${roomId}`);
    }
  }, [username, roomId, navigate]);

  if (!username) return null; // prevent render

  const userInfo = {
    name: username,
    color: getRandomColor(),
  };

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        name: userInfo.name,
        color: userInfo.color,
        cursor: null,
      }}
      initialStorage={{
        code: "// Start coding here...",
        language: "javascript",
        output: "Click ▶ Run to execute code",
        fileName: null,
      }}
    >
      <Editor />
    </RoomProvider>
  );
}

// 🔹 Home page (temporary)
function Home() {
  const createRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 10);
    window.location.href = `/room/${roomId}`;
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>🚀 Collab Editor</h1>
      <button onClick={createRoom}>Create Room</button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JoinRoom />} />
        <Route path="/room/:roomId" element={<JoinRoom />} />
        <Route path="/room/:roomId/editor" element={<RoomWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}