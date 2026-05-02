import { createClient, LiveMap, LiveList } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  publicApiKey: "pk_dev_-8kPqrqlCUS88m1JMImMiXFi69UBE3FtNnwM4LQvcXxO71hJ1ac8G7RkJ6ozC5kg",
});

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
  language: "javascript",
  output: "",
  fileName: null,
  lockedLines: new LiveMap(),
  chatMessages: new LiveList([]),
},
});

export {
  RoomProvider,
  useOthers,
  useMyPresence,
  useMutation,
  useStorage,
  LiveMap,
  LiveList,
};