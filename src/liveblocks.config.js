import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

// create Liveblocks client
const client = createClient({
  publicApiKey: "pk_dev_-8kPqrqlCUS88m1JMImMiXFi69UBE3FtNnwM4LQvcXxO71hJ1ac8G7RkJ6ozC5kg", // keep your key here
});

// create room context (this gives hooks)
const {
  RoomProvider,
  useStorage,
  useMutation,
  useOthers,
} = createRoomContext(client);

// export everything
export {
  RoomProvider,
  useStorage,
  useMutation,
  useOthers,
};