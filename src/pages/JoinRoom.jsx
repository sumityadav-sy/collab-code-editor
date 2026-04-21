import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function JoinRoom() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const { roomId } = useParams();

  const handleJoin = () => {
    if (!username.trim()) return;

    sessionStorage.setItem("username", username);

    if (roomId) {
      navigate(`/room/${roomId}/editor`);
    } else {
      const newRoomId = Math.random().toString(36).substring(2, 10);
      navigate(`/room/${newRoomId}/editor`);
    }
  };

 return (
  <div style={{
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f172a, #020617)",
    color: "#fff",
    fontFamily: "Inter, sans-serif"
  }}>
    <div style={{
      width: 420,
      padding: 32,
      borderRadius: 16,
      background: "rgba(30, 41, 59, 0.8)",
      backdropFilter: "blur(10px)",
      border: "1px solid #1e293b",
      boxShadow: "0 20px 60px rgba(0,0,0,0.6)"
    }}>
      
      {/* Logo */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>
           Collab Editor
        </h1>
        <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>
          Code together in real-time with your team.
        </p>
      </div>

      {/* Input */}
      <input
        type="text"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: 8,
          border: "1px solid #334155",
          background: "#020617",
          color: "#fff",
          marginBottom: 16,
          outline: "none"
        }}
      />

      {/* Button */}
      <button
        onClick={handleJoin}
        disabled={!username.trim()}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: 8,
          border: "none",
          background: username.trim()
            ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
            : "#334155",
          color: "#fff",
          cursor: username.trim() ? "pointer" : "not-allowed",
          fontWeight: "600",
          transition: "all 0.2s ease"
        }}
      >
        {roomId ? "Join Room →" : "Create Room →"}
      </button>

      {/* Footer hint */}
      <p style={{
        marginTop: 14,
        fontSize: 11,
        color: "#475569",
        textAlign: "center"
      }}>
        Share the room link to collaborate instantly
      </p>
    </div>
  </div>
);
}