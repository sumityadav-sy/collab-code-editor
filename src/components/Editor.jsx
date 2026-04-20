import React, { useCallback, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { vscodeLight } from "@uiw/codemirror-theme-vscode";

// 🔥 Liveblocks hooks
import {
  useStorage,
  useMutation,
  useMyPresence,
  useOthers,
} from "../liveblocks.config";

const languageExtensions = {
  javascript: javascript(),
  python: python(),
  java: java(),
  cpp: cpp(),
};

function Editor() {
  // =========================
  // 🔹 Shared Code (Storage)
  // =========================
  const code = useStorage((root) => root.code);

  const updateCode = useMutation(({ storage }, newCode) => {
    storage.set("code", newCode);
  }, []);

  // =========================
  // 🔹 FIX 1 — Language in shared Storage (not local state)
  // All users now see the same language when anyone switches
  // =========================
  const language = useStorage((root) => root.language);

  const updateLanguage = useMutation(({ storage }, newLang) => {
    storage.set("language", newLang);
  }, []);

  // =========================
  // 🔹 Presence (Live Cursors)
  // =========================
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();

  // Ref for correct cursor positioning
  const editorRef = useRef(null);

  // =========================
  // 🔹 Cursor Tracking
  // =========================
  const handlePointerMove = useCallback(
    (e) => {
      const rect = editorRef.current.getBoundingClientRect();
      updateMyPresence({
        cursor: {
          x: Math.round(e.clientX - rect.left),
          y: Math.round(e.clientY - rect.top),
        },
      });
    },
    [updateMyPresence]
  );

  const handlePointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  // Fallback while storage loads
  const activeLanguage = language || "javascript";

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* LEFT PANEL */}
      <div className="w-48 bg-gray-800 p-4 flex flex-col gap-2">
        <p className="text-xs text-gray-400 uppercase tracking-wider">File</p>
        <p className="text-sm text-white">main.js</p>
      </div>

      {/* MAIN EDITOR */}
      <div className="flex flex-col flex-1 relative">

        {/* FIX 2 — TOP BAR now contains BOTH language selector AND user badges */}
        {/* No more absolute-positioned badges floating over the editor */}
        <div className="bg-gray-800 px-4 py-2 flex items-center gap-3">
          {/* Language selector */}
          <span className="text-sm text-gray-400">Language:</span>
          <select
            value={activeLanguage}
            onChange={(e) => updateLanguage(e.target.value)}
            className="bg-gray-700 text-white text-sm px-2 py-1 rounded"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>

          {/* Spacer pushes badges to the right */}
          <div className="flex-1" />

          {/* Current user badge */}
          {myPresence?.name && (
            <div
              style={{
                background: myPresence.color,
                color: "white",
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: "500",
                whiteSpace: "nowrap",
              }}
            >
              You • {myPresence.name}
            </div>
          )}

          {/* Other user badges */}
          {others.map((user) => (
            <div
              key={user.connectionId}
              style={{
                background: user.presence?.color,
                color: "white",
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: "500",
                whiteSpace: "nowrap",
              }}
            >
              {user.presence?.name || "Guest"}
            </div>
          ))}
        </div>

        {/* CODEMIRROR WRAPPER */}
        <div
          ref={editorRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="flex-1 relative"
          style={{ height: "calc(100vh - 40px)" }}
        >
          {/* Code Editor */}
          <CodeMirror
            value={code || ""}
            height="100%"
            theme={vscodeLight}
            extensions={[languageExtensions[activeLanguage]]}
            onChange={(val) => updateCode(val)}
          />

          {/* FIX 3 — LIVE CURSORS: dot tip at pointer position, label offset to the right */}
          {others.map((user) => {
            const cursor = user.presence?.cursor;
            if (!cursor) return null;
            const color = user.presence?.color;
            const name = user.presence?.name || "Guest";

            return (
              <div
                key={user.connectionId}
                style={{
                  position: "absolute",
                  left: cursor.x,
                  top: cursor.y,
                  // No transform: the dot tip now sits exactly at the pointer coords
                  pointerEvents: "none",
                  zIndex: 100,
                }}
              >
                {/* Cursor Dot — tip at (0,0) of this container */}
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: color,
                    // Small shadow so dot is visible on light backgrounds
                    boxShadow: "0 0 0 2px rgba(0,0,0,0.25)",
                  }}
                />

                {/* Name Label — offset to the right of the dot, vertically centered */}
                <div
                  style={{
                    position: "absolute",
                    top: -4,          // vertically aligns label center with dot center
                    left: 14,         // shifts label to the right of the dot
                    background: color,
                    color: "white",
                    fontSize: 11,
                    padding: "2px 6px",
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                  }}
                >
                  {name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-48 bg-gray-800 p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider">Panel</p>
      </div>
    </div>
  );
}

export default Editor;