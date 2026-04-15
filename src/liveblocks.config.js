// Import core client creator from Liveblocks
// This is responsible for connecting your app to Liveblocks servers
import { createClient } from "@liveblocks/client";

// Import helper to create React hooks + provider
// This saves us from writing manual state syncing logic
import { createRoomContext } from "@liveblocks/react";

// Create a Liveblocks client instance
const client = createClient({
  // Your PUBLIC API key (safe for frontend use)
  // This identifies your project on Liveblocks
  publicApiKey: "pk_dev_-8kPqrqlCUS88m1JMImMiXFi69UBE3FtNnwM4LQvcXxO71hJ1ac8G7RkJ6ozC5kg",
});

// Create React utilities from the client
// These are auto-generated hooks + provider for your app
export const {
  // Provider component → wraps your app and connects to a room
  RoomProvider,

  // Hook → gives info about other users in the room
  useOthers,

  // Hook → lets you update your own presence (cursor, typing, etc.)
  useMyPresence,
} = createRoomContext(client);