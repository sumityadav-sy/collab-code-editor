import React from "react";
import { BrowserRouter, Routes, Route, useParams, useNavigate } from "react-router-dom";
import { RoomProvider, LiveMap, LiveList } from "./liveblocks.config";
import Editor from "./components/Editor";
import { COLORS } from "./utils/presence";
import JoinRoom from "./pages/JoinRoom";

// ─── Room Wrapper ─────────────────────────────────────────────────────────────
function RoomWrapper() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const username = sessionStorage.getItem("username");

  React.useEffect(() => {
    if (!username) {
      navigate(`/room/${roomId}`);
    }
  }, [username, roomId, navigate]);

  if (!username) return null;

  let color = sessionStorage.getItem("userColor");
  if (!color) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = (hash * 31 + username.charCodeAt(i)) % COLORS.length;
    }
    const offset = Math.floor(Math.random() * 3);
    color = COLORS[(hash + offset) % COLORS.length];
    sessionStorage.setItem("userColor", color);
  }

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        name: username,
        color: color,
        cursor: null,
      }}
      initialStorage={{
        code: "// Start coding here...",
        language: "javascript",
        output: "Click ▶ Run to execute code",
        fileName: null,
        lockedLines: new LiveMap(),
        chatMessages: new LiveList([]),
      }}
    >
      <Editor />
    </RoomProvider>
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