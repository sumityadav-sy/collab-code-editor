import React, { useMemo } from "react";
import { RoomProvider } from "./liveblocks.config";
import Editor from "./components/Editor";
import { getRandomColor, getRandomName } from "./utils/presence";

export default function App() {
  // useMemo ensures these values are created once per page load,
  // not regenerated on every re-render.
  const userInfo = useMemo(() => {
    return {
      name: getRandomName(),
      color: getRandomColor(),
    };
  }, []);

  return (
    <RoomProvider
      id="my-room"
      initialPresence={{
        name: userInfo.name,
        color: userInfo.color,
        cursor: null,
      }}
      initialStorage={{
        code: "// Start coding here...",
        language: "javascript", // 🔹 FIX 1: default shared language
        output: "Click ▶ Run to execute code", // ✅ NEW
      }}
    >
      <Editor />
    </RoomProvider>
  );
}

