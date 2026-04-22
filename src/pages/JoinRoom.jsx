import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

// ── Animated background particles ──────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create floating code-like particles
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.6 ? "#6366f1" : Math.random() > 0.5 ? "#06b6d4" : "#8b5cf6",
    }));

    // Floating code snippets
    const codeFloats = [
      "const room = create();", "await sync()", "{ live: true }",
      "collab.join()", "// real-time", "ws.emit('code')",
      "useState(code)", "onUpdate(v)", "liveblocks",
    ].map((text, i) => ({
      text,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vy: -0.3 - Math.random() * 0.2,
      opacity: Math.random() * 0.12 + 0.04,
      fontSize: 10 + Math.random() * 4,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, "0");
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      // Draw floating code
      codeFloats.forEach((f) => {
        ctx.font = `${f.fontSize}px 'Fira Code', monospace`;
        ctx.fillStyle = `rgba(148,163,184,${f.opacity})`;
        ctx.fillText(f.text, f.x, f.y);
        f.y += f.vy;
        if (f.y < -20) {
          f.y = canvas.height + 20;
          f.x = Math.random() * canvas.width;
        }
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

// ── Feature pill ─────────────────────────────────────────────────────────────
function FeaturePill({ icon, label }) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      background: "rgba(99,102,241,0.08)",
      border: "1px solid rgba(99,102,241,0.2)",
      borderRadius: 100,
      padding: "5px 12px",
      fontSize: 12,
      color: "#a5b4fc",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

// ── Typing animation ──────────────────────────────────────────────────────────
function TypewriterText({ texts }) {
  const [display, setDisplay] = useState("");
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[idx];
    const timeout = setTimeout(() => {
      if (!deleting) {
        setDisplay(current.slice(0, charIdx + 1));
        if (charIdx + 1 === current.length) {
          setTimeout(() => setDeleting(true), 1800);
        } else {
          setCharIdx((c) => c + 1);
        }
      } else {
        setDisplay(current.slice(0, charIdx - 1));
        if (charIdx - 1 === 0) {
          setDeleting(false);
          setIdx((i) => (i + 1) % texts.length);
          setCharIdx(0);
        } else {
          setCharIdx((c) => c - 1);
        }
      }
    }, deleting ? 40 : 70);
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, idx, texts]);

  return (
    <span style={{ color: "#818cf8" }}>
      {display}
      <span style={{
        display: "inline-block",
        width: 2,
        height: "1em",
        background: "#6366f1",
        marginLeft: 2,
        verticalAlign: "text-bottom",
        animation: "blink 1s step-end infinite",
      }} />
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function JoinRoom() {
  const [username, setUsername] = useState("");
  const [focused, setFocused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {
    // Slight delay for entrance animation
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleJoin = () => {
    if (!username.trim()) return;
    sessionStorage.setItem("username", username.trim());
    if (roomId) {
      navigate(`/room/${roomId}/editor`);
    } else {
      const newRoomId = Math.random().toString(36).substring(2, 10);
      navigate(`/room/${newRoomId}/editor`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleJoin();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 20% 50%, #0d1224 0%, #060912 50%, #0a0d1a 100%)",
      display: "flex",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      position: "relative",
      overflow: "hidden",
      color: "#fff",
    }}>
      <ParticleCanvas />

      {/* Ambient glow blobs */}
      <div style={{
        position: "fixed",
        top: "-20%",
        left: "-10%",
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed",
        bottom: "-20%",
        right: "-10%",
        width: 700,
        height: 700,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* ── LEFT PANEL: Info ─────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 64px",
        position: "relative",
        zIndex: 1,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateX(0)" : "translateX(-30px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}>

        {/* Logo area — swap src with your actual logo */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 48,
        }}>
          {/* Logo placeholder — replace the div below with <img src="/logo.png" ... /> */}
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(135deg, #6366f1, #06b6d4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            boxShadow: "0 0 24px rgba(99,102,241,0.4)",
            flexShrink: 0,
          }}>
            {/* ↓ Replace this emoji with: <img src="/your-logo.png" style={{width:28,height:28}} /> */}
            <img src={`${window.location.origin}/coollab_logo.png`} style={{ width: 33, height: 33, objectFit: "contain",borderRadius: '8px' }} />

          </div>
          <div>
            <div style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              background: "linear-gradient(90deg, #e2e8f0, #94a3b8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              CollabEditor
            </div>
            <div style={{ fontSize: 11, color: "#475569", letterSpacing: "0.05em" }}>
              REAL-TIME CODE COLLABORATION
            </div>
          </div>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(32px, 4vw, 52px)",
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          margin: "0 0 16px",
          color: "#f1f5f9",
        }}>
          Code together,<br />
          <TypewriterText texts={[
            "ship faster.",
            "think better.",
            "build more.",
            "learn live.",
          ]} />
        </h1>

        <p style={{
          fontSize: 15,
          color: "#64748b",
          lineHeight: 1.7,
          maxWidth: 420,
          marginBottom: 36,
        }}>
          A multiplayer code editor with live cursors, shared execution,
          AI assistance, and instant room sharing — built for teams who move fast.
        </p>

        {/* Feature pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 48 }}>
          <FeaturePill icon="⚡" label="Real-time sync" />
          <FeaturePill icon="🤖" label="AI assistant" />
          <FeaturePill icon="▶" label="Run code live" />
          <FeaturePill icon="👥" label="Live cursors" />
          <FeaturePill icon="🔗" label="One-click share" />
          <FeaturePill icon="💾" label="Open & save files" />
        </div>

        {/* Language badges */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#334155", marginRight: 4 }}>Supports</span>
          {["JS", "Python", "Java", "C++"].map((lang) => (
            <span key={lang} style={{
              fontSize: 11,
              fontFamily: "'Fira Code', monospace",
              color: "#475569",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 4,
              padding: "2px 8px",
            }}>
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* ── DIVIDER ─────────────────────────────────────────────────────────── */}
      <div style={{
        width: 1,
        background: "linear-gradient(to bottom, transparent, rgba(99,102,241,0.15) 30%, rgba(99,102,241,0.15) 70%, transparent)",
        alignSelf: "stretch",
        flexShrink: 0,
        zIndex: 1,
      }} />

      {/* ── RIGHT PANEL: Join Form ───────────────────────────────────────── */}
      <div style={{
        width: 460,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 52px",
        position: "relative",
        zIndex: 1,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateX(0)" : "translateX(30px)",
        transition: "opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s",
      }}>

        {/* Status dot */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 32,
        }}>
          <div style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#22c55e",
            boxShadow: "0 0 8px #22c55e",
            animation: "pulse 2s ease infinite",
          }} />
          <span style={{ fontSize: 12, color: "#4b5563", letterSpacing: "0.06em" }}>
            {roomId ? `ROOM · ${roomId.toUpperCase()}` : "SERVERS ONLINE"}
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(15, 23, 42, 0.7)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(99,102,241,0.15)",
          borderRadius: 20,
          padding: "36px 32px",
          boxShadow: "0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}>

          <h2 style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: 6,
            color: "#e2e8f0",
          }}>
            {roomId ? "Join the room" : "Start a session"}
          </h2>
          <p style={{ fontSize: 13, color: "#475569", marginBottom: 28 }}>
            {roomId
              ? "Enter your name to jump into the live session."
              : "Create a room and invite your team instantly."}
          </p>

          {/* Username input */}
          <div style={{ marginBottom: 16, position: "relative" }}>
            <label style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              color: "#4b5563",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}>
              Your display name
            </label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 15,
                opacity: 0.5,
              }}>
                @
              </span>
              <input
                type="text"
                placeholder="e.g. sumit, alex, dev_123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoFocus
                style={{
                  width: "100%",
                  padding: "13px 14px 13px 30px",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${focused ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 10,
                  color: "#f1f5f9",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleJoin}
            disabled={!username.trim()}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 10,
              border: "none",
              background: username.trim()
                ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)"
                : "rgba(255,255,255,0.05)",
              backgroundSize: "200% 200%",
              color: username.trim() ? "#fff" : "#374151",
              fontSize: 14,
              fontWeight: 700,
              cursor: username.trim() ? "pointer" : "not-allowed",
              letterSpacing: "0.01em",
              transition: "all 0.2s ease",
              boxShadow: username.trim() ? "0 8px 24px rgba(99,102,241,0.35)" : "none",
              animation: username.trim() ? "gradientShift 3s ease infinite" : "none",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              if (username.trim()) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(99,102,241,0.45)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = username.trim() ? "0 8px 24px rgba(99,102,241,0.35)" : "none";
            }}
          >
            {roomId ? "→ Join Room" : "→ Create Room"}
          </button>

          {/* Hint */}
          <p style={{
            textAlign: "center",
            fontSize: 11,
            color: "#1e293b",
            marginTop: 14,
            letterSpacing: "0.03em",
          }}>
            Press Enter to continue
          </p>
        </div>

        {/* What happens next */}
        {!roomId && (
          <div style={{
            marginTop: 20,
            padding: "14px 18px",
            background: "rgba(6,182,212,0.04)",
            border: "1px solid rgba(6,182,212,0.1)",
            borderRadius: 10,
          }}>
            <p style={{ fontSize: 12, color: "#164e63", marginBottom: 8, fontWeight: 600 }}>
              What happens next?
            </p>
            {[
              "A unique room is generated for you",
              "Copy the link and share with teammates",
              "Code together in real-time instantly",
            ].map((step, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: i < 2 ? 6 : 0,
              }}>
                <div style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "rgba(6,182,212,0.12)",
                  border: "1px solid rgba(6,182,212,0.2)",
                  color: "#06b6d4",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 12, color: "#334155" }}>{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Developer credit */}
        <div style={{
          marginTop: 32,
          textAlign: "center",
        }}>
          <span style={{
            fontSize: 11,
            color: "#1e293b",
            letterSpacing: "0.05em",
          }}>
            crafted with{" "}
            <span style={{ color: "#e11d48", fontSize: 12 }}>♥</span>
            {" "}by{" "}
            <span style={{
              color: "#334155",
              fontWeight: 600,
              background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Sumit Yadav
            </span>
          </span>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Fira+Code:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px #22c55e; }
          50% { opacity: 0.6; box-shadow: 0 0 16px #22c55e; }
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        input::placeholder { color: #1e293b; }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .left-panel { display: none !important; }
          .divider { display: none !important; }
          .right-panel {
            width: 100% !important;
            padding: 32px 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
