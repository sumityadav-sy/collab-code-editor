import React, { useCallback, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { useEffect } from "react";
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

// Language extensions for CodeMirror
const languageExtensions = {
  javascript: javascript(),
  python: python(),
  java: java(),
  cpp: cpp(),
};

function Editor() {
  // =========================
  // 🔹 Shared Code (Liveblocks)
  // =========================
  const code = useStorage((root) => root.code);

  const updateCode = useMutation(({ storage }, newCode) => {
    storage.set("code", newCode);
  }, []);

  // =========================
  // 🔹 Shared Language
  // =========================
  const language = useStorage((root) => root.language);

  const updateLanguage = useMutation(({ storage }, newLang) => {
    storage.set("language", newLang);
  }, []);

  // =========================
  // 🔹 Shared Output (NEW)
  // =========================
  const output = useStorage((root) => root.output);

  const updateOutput = useMutation(({ storage }, value) => {
    storage.set("output", value);
  }, []);

  // =========================
  // 🔹 Local UI State
  // =========================
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  useEffect(() => {
  if (output && output !== "Click ▶ Run to execute code") {
    setShowOutput(true);
  }
}, [output]);

  // =========================
  // 🔹 Presence (Live Cursors)
  // =========================
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();

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

  const activeLanguage = language || "javascript";

  // =========================
  // 🚀 RUN CODE FUNCTION (PISTON API)
  // =========================
  const runCode = async () => {
  setIsRunning(true);
  setShowOutput(true);

  updateOutput("Running...");

  const languageIds = {
    javascript: 63,
    python: 71,
    java: 62,
    cpp: 54,
  };

  try {
    // 🔥 STEP 1: Submit code
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

    // ✅ HANDLE API LIMIT HERE
    if (submitRes.status === 429) {
      updateOutput("API limit reached. Try again later.");
      setIsRunning(false);
      return;
    }

    const submitData = await submitRes.json();
    const token = submitData.token;

    // 🔥 STEP 2: Poll for result
    let result = null;

    while (true) {
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
        // still processing
        await new Promise((r) => setTimeout(r, 1000));
      } else {
        result =
          data.stdout ||
          data.stderr ||
          data.compile_output ||
          "No output";
        break;
      }
    }

    // 🔥 IMPORTANT: force sync update
    updateOutput(result + " ");

  } catch (err) {
    console.error(err);
    updateOutput("Error running code");
  }

  setIsRunning(false);
};

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* LEFT PANEL */}
      <div className="w-48 bg-gray-800 p-4">
        <p className="text-xs text-gray-400 uppercase">File</p>
        <p className="text-sm">main.js</p>
      </div>

      {/* MAIN EDITOR */}
      <div className="flex flex-col flex-1">

        {/* TOP BAR */}
        <div className="bg-gray-800 px-4 py-2 flex items-center gap-3">
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

          {/* ▶ RUN BUTTON */}
          <button
            onClick={runCode}
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
          >
            {isRunning ? "Running..." : "▶ Run"}
          </button>

          <div className="flex-1" />

          {/* USER BADGES */}
          {myPresence?.name && (
            <div
              style={{
                background: myPresence.color,
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "13px",
              }}
            >
              You • {myPresence.name}
            </div>
          )}

          {others.map((user) => (
            <div
              key={user.connectionId}
              style={{
                background: user.presence?.color,
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "13px",
              }}
            >
              {user.presence?.name || "Guest"}
            </div>
          ))}
        </div>

        {/* ================= EDITOR + OUTPUT ================= */}
        <div className="flex flex-col flex-1">

          {/* EDITOR */}
          <div className={`${showOutput ? "h-[60%]" : "h-full"} relative`}>
            <div
              ref={editorRef}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              className="h-full relative"
            >
              <CodeMirror
                value={code || ""}
                height="100%"
                theme={vscodeLight}
                extensions={[languageExtensions[activeLanguage]]}
                onChange={(val) => updateCode(val)}
              />

              {/* LIVE CURSORS */}
              {others.map((user) => {
                const cursor = user.presence?.cursor;
                if (!cursor) return null;

                return (
                  <div
                    key={user.connectionId}
                    style={{
                      position: "absolute",
                      left: cursor.x,
                      top: cursor.y,
                      pointerEvents: "none",
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: user.presence?.color,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: 14,
                        top: -4,
                        background: user.presence?.color,
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: 11,
                      }}
                    >
                      {user.presence?.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* OUTPUT PANEL */}
          {showOutput && (
            <div className="h-[40%] bg-black border-t border-gray-700 flex flex-col">
              
              <div className="flex justify-between px-3 py-2 bg-gray-900">
                <span className="text-xs text-gray-400 uppercase">
                  Output
                </span>

                <button onClick={() => setShowOutput(false)}>✕</button>
              </div>

              <div className="flex-1 overflow-auto p-3">
                <pre
                  className={`whitespace-pre-wrap ${
                    output?.toLowerCase().includes("error")
                      ? "text-red-400"
                      : "text-green-400"
                  }`} key={output}
                >
                  {output}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-48 bg-gray-800 p-4">
        <p className="text-xs text-gray-400 uppercase">Panel</p>
      </div>
    </div>
  );
}

export default Editor;