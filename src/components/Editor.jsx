import React, { useCallback, useRef, useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";

// 🔥 Liveblocks hooks
import {
  useStorage,
  useMutation,
  useMyPresence,
  useOthers,
} from "../liveblocks.config";

// Language extensions for CodeMirror
const languageExtensions = {
  javascript: javascript(),
  python: python(),
  java: java(),
  cpp: cpp(),
};

// File extension → language map (for auto-detecting language on open)
const extToLanguage = {
  js: "javascript",
  mjs: "javascript",
  py: "python",
  java: "java",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
};

// ─── Collaborator Card ───────────────────────────────────────────────────────
function CollaboratorCard({ name, color, line, col, isYou }) {
  const hasPosition = line != null && col != null;
  return (
    <div style={{
      borderLeft: `3px solid ${color}`,
      background: "rgba(255,255,255,0.03)",
      borderRadius: "6px",
      padding: "8px 10px",
      marginBottom: "8px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: color, flexShrink: 0,
        }} />
        <span style={{
          fontSize: 12, fontWeight: 600, color: "#e2e8f0",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {isYou ? `${name} (You)` : name}
        </span>
      </div>
      <div style={{
        marginTop: 5, fontSize: 11,
        color: hasPosition ? "#94a3b8" : "#4b5563",
        paddingLeft: 14,
      }}>
        {hasPosition ? `Line ${line} · Col ${col}` : "Idle"}
      </div>
    </div>
  );
}

// ─── AI Chat Message ─────────────────────────────────────────────────────────
function ChatMessage({ role, text }) {
  const isAI = role === "ai";
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: isAI ? "flex-start" : "flex-end",
      marginBottom: 12,
    }}>
      <div style={{
        fontSize: 10,
        color: "#475569",
        marginBottom: 4,
        paddingLeft: isAI ? 2 : 0,
        paddingRight: isAI ? 0 : 2,
      }}>
        {isAI ? "✦ AI" : "You"}
      </div>
      <div style={{
        maxWidth: "88%",
        background: isAI ? "#1e293b" : "#1d4ed8",
        border: isAI ? "1px solid #334155" : "1px solid #2563eb",
        borderRadius: isAI ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
        padding: "9px 12px",
        fontSize: 12.5,
        lineHeight: 1.6,
        color: isAI ? "#cbd5e1" : "#e0eaff",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {text}
      </div>
    </div>
  );
}

// ─── Main Editor ─────────────────────────────────────────────────────────────
function Editor() {
  // =========================
  // 🔹 Shared Storage
  // =========================
  const code = useStorage((root) => root.code);
  const updateCode = useMutation(({ storage }, newCode) => {
    storage.set("code", newCode);
  }, []);

  const language = useStorage((root) => root.language);
  const updateLanguage = useMutation(({ storage }, newLang) => {
    storage.set("language", newLang);
  }, []);

  const output = useStorage((root) => root.output);
  const updateOutput = useMutation(({ storage }, value) => {
    storage.set("output", value);
  }, []);

  const sharedFileName = useStorage((root) => root.fileName);
  const updateSharedFileName = useMutation(({ storage }, name) => {
    storage.set("fileName", name);
  }, []);

  // =========================
  // 🔹 Local UI State
  // =========================
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [toast, setToast] = useState(null);

  // ── AI Chat State ──
  const [messages, setMessages] = useState([
    { role: "ai", text: "👋 Hi! I can explain your code, find bugs, or suggest improvements. Ask me anything or use a quick action below." }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const chatBottomRef = useRef(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (output && output !== "Click ▶ Run to execute code") {
      setShowOutput(true);
    }
  }, [output]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiLoading]);

  // =========================
  // 🔹 Presence
  // =========================
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const editorRef = useRef(null);

  // =========================
  // 🔹 Mouse cursor tracking
  // =========================
  const handlePointerMove = useCallback(
    (e) => {
      const rect = editorRef.current.getBoundingClientRect();
      updateMyPresence({
        cursor: {
          ...(myPresence?.cursor || {}),
          x: Math.round(e.clientX - rect.left),
          y: Math.round(e.clientY - rect.top),
        },
      });
    },
    [updateMyPresence, myPresence]
  );

  const handlePointerLeave = useCallback(() => {
    updateMyPresence({
      cursor: myPresence?.cursor
        ? { ...myPresence.cursor, x: null, y: null }
        : null,
    });
  }, [updateMyPresence, myPresence]);

  // =========================
  // 🔹 Caret position tracking
  // =========================
  const handleEditorUpdate = useCallback(
    (viewUpdate) => {
      if (!viewUpdate.selectionSet) return;
      const state = viewUpdate.state;
      const head = state.selection.main.head;
      const line = state.doc.lineAt(head);
      updateMyPresence({
        cursor: {
          ...(myPresence?.cursor || {}),
          line: line.number,
          col: head - line.from + 1,
        },
      });
    },
    [updateMyPresence, myPresence]
  );

  const activeLanguage = language || "javascript";

  // =========================
  // 📂 OPEN FILE
  // =========================
  const handleOpenFile = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";

      const ext = file.name.split(".").pop().toLowerCase();
      const detectedLang = extToLanguage[ext] || "javascript";

      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target.result;
        updateCode(content);
        updateLanguage(detectedLang);
        updateSharedFileName(file.name);
        updateOutput("Click ▶ Run to execute code");
        setToast({ message: `Opened: ${file.name}`, type: "success" });
      };
      reader.onerror = () => {
        setToast({ message: "Failed to read file", type: "error" });
      };
      reader.readAsText(file);
    },
    [updateCode, updateLanguage, updateSharedFileName, updateOutput]
  );

  // =========================
  // 💾 SAVE FILE
  // =========================
  const handleSaveFile = useCallback(() => {
    const defaultNames = {
      javascript: "main.js",
      python: "main.py",
      java: "Main.java",
      cpp: "main.cpp",
    };
    const filename = sharedFileName || defaultNames[activeLanguage];
    const blob = new Blob([code || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: `Saved: ${filename}`, type: "success" });
  }, [code, activeLanguage, sharedFileName]);

  const defaultFileNames = {
    javascript: "main.js",
    python: "main.py",
    java: "Main.java",
    cpp: "main.cpp",
  };
  const displayFileName = sharedFileName || defaultFileNames[activeLanguage];

  //==================
  //link copy function
  //==================
  const handleCopyLink = () => {
  navigator.clipboard.writeText(window.location.href);

 setToast({
  message: "🔗 Link copied! Share it with your team",
  type: "success",
});
};

  // =========================
  // 🚀 Run Code (Judge0 via RapidAPI)
  // =========================
  const runCode = async () => {
    setIsRunning(true);
    setShowOutput(true);
    updateOutput("Running...");

    const languageIds = { javascript: 63, python: 71, java: 62, cpp: 54 };

    try {
      const submitRes = await fetch(
        "https://judge029.p.rapidapi.com/submissions?base64_encoded=false&wait=false",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": import.meta.env.VITE_RAPIDAPI_KEY,
            "X-RapidAPI-Host": import.meta.env.VITE_RAPIDAPI_HOST,
          },
          body: JSON.stringify({
            source_code: code,
            language_id: languageIds[activeLanguage],
            stdin: "",
          }),
        }
      );

      if (submitRes.status === 429) {
        updateOutput("API limit reached. Try again later.");
        setIsRunning(false);
        return;
      }

      const submitData = await submitRes.json();
      const token = submitData.token;
      let result = null;
      let retries = 0;

      while (retries < 15) {
        retries++;
        const res = await fetch(
          `https://judge029.p.rapidapi.com/submissions/${token}?base64_encoded=false`,
          {
            headers: {
              "X-RapidAPI-Key": import.meta.env.VITE_RAPIDAPI_KEY,
              "X-RapidAPI-Host": import.meta.env.VITE_RAPIDAPI_HOST,
            },
          }
        );
        const data = await res.json();
        if (data.status?.id <= 2) {
          await new Promise((r) => setTimeout(r, 1000));
        } else {
          result = data.stdout || data.stderr || data.compile_output || "No output";
          break;
        }
      }

      updateOutput((result || "Execution timed out") + " ");
    } catch (err) {
      console.error(err);
      updateOutput("Error running code");
    }

    setIsRunning(false);
  };

  // =========================
  // 🤖 AI Chat (Day 7)
  // =========================
  const askAI = async (prompt) => {
    if (!prompt.trim()) return;

    const currentCode = code || "";
    setMessages((prev) => [...prev, { role: "user", text: prompt }]);
    setAiInput("");
    setIsAiLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: currentCode, prompt }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: data.reply || "No response from AI." },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "⚠️ Could not reach the AI server. Make sure your backend is running on localhost:3001." },
      ]);
    }

    setIsAiLoading(false);
  };

  const handleAiSend = () => {
    if (aiInput.trim()) askAI(aiInput.trim());
  };

  const handleAiKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAiSend();
    }
  };

  // Quick action buttons
  const quickActions = [
    { label: "Explain this code", prompt: "Explain what this code does in simple terms." },
    { label: "Fix bugs", prompt: "Find and fix any bugs or issues in this code." },
    { label: "Improve this", prompt: "Suggest improvements to make this code cleaner, more efficient, or more readable." },
  ];

  // ─── Button style helper ────────────────────────────────────────────────────
  const panelBtn = (accent) => ({
    width: "100%",
    padding: "7px 0",
    borderRadius: 5,
    border: `1px solid ${accent}33`,
    background: `${accent}11`,
    color: accent,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    transition: "background 0.15s, border-color 0.15s",
  });

  return (
    <div style={{ display: "flex", height: "100vh", background: "#111827", color: "#fff" }}>

      {/* ═══════════════════════════════════════
          LEFT PANEL
      ═══════════════════════════════════════ */}
      <div style={{
        width: 192,
        background: "#0f172a",
        borderRight: "1px solid #1e293b",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}>

        {/* Collaborators header */}
        <div style={{ padding: "12px 12px 8px", borderBottom: "1px solid #1e293b" }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
            color: "#475569", textTransform: "uppercase", marginBottom: 2,
          }}>
            Collaborators
          </p>
          <p style={{ fontSize: 11, color: "#334155" }}>
            {1 + others.count} online
          </p>
        </div>

        {/* Collaborator cards */}
        <div style={{ padding: "10px", overflowY: "auto", flex: 1 }}>
          {myPresence?.name && (
            <CollaboratorCard
              name={myPresence.name}
              color={myPresence.color}
              line={myPresence.cursor?.line}
              col={myPresence.cursor?.col}
              isYou
            />
          )}
          {others.map((user) => (
            <CollaboratorCard
              key={user.connectionId}
              name={user.presence?.name || "Guest"}
              color={user.presence?.color || "#6b7280"}
              line={user.presence?.cursor?.line}
              col={user.presence?.cursor?.col}
              isYou={false}
            />
          ))}
        </div>

        {/* ── File section ── */}
        <div style={{ padding: "10px 12px", borderTop: "1px solid #1e293b" }}>
          <p style={{
            fontSize: 10, color: "#475569",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
          }}>
            File
          </p>

          {/* Current filename pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            marginBottom: 10, padding: "5px 8px",
            background: "#1e293b", borderRadius: 5,
          }}>
            <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
              <path d="M1 1h6l3 3v8H1V1z" stroke="#64748b" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
              <path d="M7 1v3h3" stroke="#64748b" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            <span style={{
              fontSize: 11, color: "#94a3b8",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {displayFileName}
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".js,.mjs,.py,.java,.cpp,.cc,.cxx"
            style={{ display: "none" }}
            onChange={handleOpenFile}
          />

          <button
            style={panelBtn("#60a5fa")}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#60a5fa22";
              e.currentTarget.style.borderColor = "#60a5fa66";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#60a5fa11";
              e.currentTarget.style.borderColor = "#60a5fa33";
            }}
          >
            <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
              <path d="M1 2.5h3l1.5-1.5h4L11 2.5h1v8H1v-8z" stroke="#60a5fa" strokeWidth="1.1" fill="none" strokeLinejoin="round"/>
            </svg>
            Open File
          </button>

          <button
            style={{ ...panelBtn("#4ade80"), marginTop: 7 }}
            onClick={handleSaveFile}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#4ade8022";
              e.currentTarget.style.borderColor = "#4ade8066";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#4ade8011";
              e.currentTarget.style.borderColor = "#4ade8033";
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="#4ade80" strokeWidth="1.1" fill="none"/>
              <rect x="3.5" y="1" width="5" height="3.5" rx="0.5" stroke="#4ade80" strokeWidth="1.1" fill="none"/>
              <rect x="2.5" y="6" width="7" height="4" rx="0.5" stroke="#4ade80" strokeWidth="1.1" fill="none"/>
            </svg>
            Save File
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          MAIN EDITOR AREA
      ═══════════════════════════════════════ */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>

        {/* TOP BAR */}
        <div style={{
          background: "#1e293b",
          borderBottom: "1px solid #334155",
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>Language:</span>

          <select
            value={activeLanguage}
            onChange={(e) => updateLanguage(e.target.value)}
            style={{
              background: "#334155", color: "#fff", fontSize: 13,
              padding: "3px 8px", borderRadius: 4, border: "none", outline: "none",
            }}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>

          <button
            onClick={runCode}
            disabled={isRunning}
            style={{
              background: isRunning ? "#166534" : "#16a34a",
              color: "#fff", fontSize: 13,
              padding: "4px 14px", borderRadius: 4, border: "none",
              cursor: isRunning ? "not-allowed" : "pointer",
              opacity: isRunning ? 0.7 : 1,
              transition: "background 0.15s",
            }}
          >
            {isRunning ? "Running..." : "▶ Run"}
          </button>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          <button
            onClick={handleCopyLink}
            style={{
              background: "#0ea5e9",
              border: "1px solid #38bdf8",
              color: "#e0f2fe",
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 4,
              cursor: "pointer",
              marginRight: 8,
            }}
          >
            🔗 Copy Link
          </button>

          

          {/* Toggle AI Panel button */}
          <button
            onClick={() => setShowAiPanel((v) => !v)}
            title={showAiPanel ? "Hide AI Panel" : "Show AI Panel"}
            style={{
              background: showAiPanel ? "#312e81" : "#1e293b",
              border: `1px solid ${showAiPanel ? "#6366f1" : "#334155"}`,
              color: showAiPanel ? "#a5b4fc" : "#64748b",
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 4,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 14 }}>✦</span>
            {showAiPanel ? "Hide AI" : "AI Chat"}
          </button>
        </div>

        {/* EDITOR + OUTPUT + AI PANEL (horizontal) */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

          {/* Editor + Output (vertical stack) */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>

            {/* EDITOR */}
            <div style={{
              flex: showOutput ? "0 0 60%" : "1 1 100%",
              position: "relative", overflow: "hidden",
            }}>
              <div
                ref={editorRef}
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
                style={{
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <CodeMirror
                  value={code || ""}
                  height="100%"
                  style={{ height: "100%" }}
                  basicSetup={{ lineNumbers: true }}
                  extensions={[languageExtensions[activeLanguage]]}
                  onChange={(val) => updateCode(val)}
                  onUpdate={handleEditorUpdate}
                  theme={vscodeDark}
                />

                {/* LIVE MOUSE CURSORS */}
                {others.map((user) => {
                  const cursor = user.presence?.cursor;
                  if (!cursor || cursor.x == null || cursor.y == null) return null;
                  return (
                    <div
                      key={user.connectionId}
                      style={{
                        position: "absolute",
                        left: cursor.x, top: cursor.y,
                        pointerEvents: "none", zIndex: 10,
                      }}
                    >
                      <div style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: user.presence?.color,
                      }} />
                      <div style={{
                        position: "absolute", left: 14, top: -4,
                        background: user.presence?.color,
                        color: "#fff", padding: "2px 6px",
                        borderRadius: 4, fontSize: 11,
                        whiteSpace: "nowrap", fontWeight: 500,
                      }}>
                        {user.presence?.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* OUTPUT PANEL */}
            {showOutput && (
              <div style={{
                flex: "0 0 40%", background: "#000",
                borderTop: "1px solid #334155",
                display: "flex", flexDirection: "column", minHeight: 0,
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "6px 12px", background: "#0f172a",
                  borderBottom: "1px solid #1e293b",
                }}>
                  <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Output
                  </span>
                  <button
                    onClick={() => setShowOutput(false)}
                    style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ flex: 1, overflow: "auto", padding: "12px" }}>
                  <pre style={{
                    whiteSpace: "pre-wrap", fontSize: 13,
                    fontFamily: "monospace", margin: 0,
                    color: output?.toLowerCase().includes("error") ? "#f87171" : "#4ade80",
                  }}>
                    {output}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════
              RIGHT: AI CHAT PANEL (Day 7)
          ═══════════════════════════════════════ */}
          {showAiPanel && (
            <div style={{
              width: 300,
              flexShrink: 0,
              background: "#0a0f1e",
              borderLeft: "1px solid #1e293b",
              display: "flex",
              flexDirection: "column",
            }}>

              {/* AI Panel Header */}
              <div style={{
                padding: "10px 14px",
                borderBottom: "1px solid #1e293b",
                background: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, flexShrink: 0,
                }}>
                  ✦
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>
                    AI Assistant
                  </div>
                  <div style={{ fontSize: 10, color: "#475569" }}>
                    Powered by Claude via OpenRouter
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{
                padding: "10px 12px",
                borderBottom: "1px solid #1e293b",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}>
                <p style={{
                  fontSize: 10, color: "#475569",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  marginBottom: 2,
                }}>
                  Quick Actions
                </p>
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => askAI(action.prompt)}
                    disabled={isAiLoading}
                    style={{
                      background: "rgba(99,102,241,0.08)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      color: "#a5b4fc",
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 11.5,
                      fontWeight: 500,
                      cursor: isAiLoading ? "not-allowed" : "pointer",
                      textAlign: "left",
                      transition: "background 0.15s, border-color 0.15s",
                      opacity: isAiLoading ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isAiLoading) {
                        e.currentTarget.style.background = "rgba(99,102,241,0.18)";
                        e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(99,102,241,0.08)";
                      e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)";
                    }}
                  >
                    {action.label === "Explain this code" && "💡 "}
                    {action.label === "Fix bugs" && "🐛 "}
                    {action.label === "Improve this" && "⚡ "}
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Chat History */}
              <div style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
              }}>
                {messages.map((msg, i) => (
                  <ChatMessage key={i} role={msg.role} text={msg.text} />
                ))}

                {/* Loading indicator */}
                {isAiLoading && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 0", marginBottom: 8,
                  }}>
                    <div style={{
                      display: "flex", gap: 4, alignItems: "center",
                    }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: "#6366f1",
                          animation: `aiPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: "#475569" }}>
                      AI is thinking...
                    </span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Input Area */}
              <div style={{
                padding: "10px 12px",
                borderTop: "1px solid #1e293b",
                background: "#0f172a",
              }}>
                <div style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "flex-end",
                }}>
                  <textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={handleAiKeyDown}
                    placeholder="Ask about your code... (Enter to send)"
                    rows={2}
                    disabled={isAiLoading}
                    style={{
                      flex: 1,
                      background: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: 7,
                      color: "#e2e8f0",
                      fontSize: 12.5,
                      padding: "8px 10px",
                      resize: "none",
                      outline: "none",
                      fontFamily: "inherit",
                      lineHeight: 1.5,
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#6366f1"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#334155"; }}
                  />
                  <button
                    onClick={handleAiSend}
                    disabled={isAiLoading || !aiInput.trim()}
                    style={{
                      background: (isAiLoading || !aiInput.trim()) ? "#1e293b" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      border: "none",
                      borderRadius: 7,
                      color: (isAiLoading || !aiInput.trim()) ? "#475569" : "#fff",
                      width: 36,
                      height: 52,
                      cursor: (isAiLoading || !aiInput.trim()) ? "not-allowed" : "pointer",
                      fontSize: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.15s",
                    }}
                  >
                    ↑
                  </button>
                </div>
                <p style={{
                  fontSize: 10, color: "#334155",
                  marginTop: 5, textAlign: "center",
                }}>
                  Shift+Enter for new line · Enter to send
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          TOAST NOTIFICATION
      ═══════════════════════════════════════ */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          background: toast.type === "success" ? "#14532d" : "#7f1d1d",
          border: `1px solid ${toast.type === "success" ? "#16a34a" : "#dc2626"}`,
          color: toast.type === "success" ? "#4ade80" : "#f87171",
          padding: "10px 16px", borderRadius: 8,
          fontSize: 13, fontWeight: 500,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          zIndex: 9999,
          animation: "fadeIn 0.25s ease, slideUp 0.25s ease",
        }}>
          {toast.type === "success" ? "✓" : "✕"} {toast.message}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes aiPulse {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        /* Make CodeMirror scrollable */
        .cm-editor {
          height: 100% !important;
        }

        .cm-scroller {
          overflow: auto !important;
        }

        .cm-content {
          min-height: 100%;
        }

        .cm-editor {
          background-color: #1e1e1e !important;
          color: #d4d4d4;
        }

        .cm-gutters {
          background-color: #1e1e1e !important;
          color: #858585;
          border: none;
        }

        /* Scrollbar styling for AI chat */
        .ai-chat-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .ai-chat-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .ai-chat-scroll::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 2px;
        }
         @keyframes slideUp {
  from { transform: translateY(10px); }
  to { transform: translateY(0); }
} 
      `}</style>
    </div>
  );
}

export default Editor;
