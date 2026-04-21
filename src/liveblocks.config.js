import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

// create Liveblocks client
const client = createClient({
  publicApiKey: "pk_dev_-8kPqrqlCUS88m1JMImMiXFi69UBE3FtNnwM4LQvcXxO71hJ1ac8G7RkJ6ozC5kg", // keep your key here
});
// This defines the TypeScript-like shape of our room data.
// Even in JS projects, keeping this structure clear helps a lot.
const {
  RoomProvider,
  useOthers,
  useMyPresence,
  useMutation,
  useStorage,
} = createRoomContext(client, {
  Presence: {
    name: "",
    color: "",
    cursor: null,
  },
  Storage: {
    code: "",
    language: "javascript", // 🔹 FIX 1: shared language state
    output: "", // ✅ NEW (shared output)
  },
});

export {
  RoomProvider,
  useOthers,
  useMyPresence,
  useMutation,
  useStorage,
};