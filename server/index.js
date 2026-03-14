import { WebSocketServer } from "ws";
import RoomStore from "./roomStore.js";
import { TYPES } from "./protocol.js";

const PORT = Number(process.env.PORT || 8787);
const ROOM_TTL_MS = 1000 * 60 * 60 * 2;

const roomStore = new RoomStore();
const wss = new WebSocketServer({ port: PORT });

let idCounter = 0;

function nextClientId() {
  idCounter += 1;
  return `client-${idCounter}`;
}

function send(ws, type, payload = {}) {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify({ type, payload }));
}

function relaySignal(sender, room, signal) {
  const target = room.host.id === sender.id ? room.guest?.ws : room.host.ws;
  if (!target) return;
  send(target, TYPES.SIGNAL, { roomId: room.roomId, signal });
}

function validateName(name) {
  if (typeof name !== "string") return null;
  const normalized = name.trim().slice(0, 15);
  return normalized || null;
}

wss.on("connection", (ws) => {
  const client = {
    id: nextClientId(),
    ws,
    roomId: null,
    role: null,
    name: null,
  };

  ws.on("message", (raw) => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      send(ws, TYPES.ERROR, { message: "invalid_json" });
      return;
    }

    const { type, payload = {} } = message;

    if (type === TYPES.CREATE_ROOM) {
      const hostName = validateName(payload.name) || "HOST";
      const mode = Number.isInteger(payload.mode) ? payload.mode : 0;
      const existing = roomStore.removeClient(client.id);
      if (existing?.role === "guest") {
        send(existing.room.host.ws, TYPES.PEER_LEFT, {
          roomId: existing.room.roomId,
        });
      }

      client.name = hostName;
      client.role = "host";

      const room = roomStore.createRoom(
        { id: client.id, name: hostName, ws },
        mode,
      );
      client.roomId = room.roomId;

      send(ws, TYPES.ROOM_CREATED, {
        roomId: room.roomId,
        hostName,
        mode: room.mode,
      });
      return;
    }

    if (type === TYPES.LIST_ROOMS) {
      send(ws, TYPES.ROOM_LIST, { rooms: roomStore.listJoinableRooms() });
      return;
    }

    if (type === TYPES.JOIN_ROOM) {
      const guestName = validateName(payload.name) || "GUEST";
      const roomId = payload.roomId;
      if (typeof roomId !== "string") {
        send(ws, TYPES.ERROR, { message: "invalid_room_id" });
        return;
      }

      const joinResult = roomStore.joinRoom(roomId, {
        id: client.id,
        name: guestName,
        ws,
      });

      if (!joinResult.ok) {
        send(ws, TYPES.ERROR, { message: joinResult.reason });
        return;
      }

      const { room } = joinResult;
      client.name = guestName;
      client.role = "guest";
      client.roomId = room.roomId;

      send(ws, TYPES.ROOM_JOINED, {
        roomId: room.roomId,
        hostName: room.host.name,
        mode: room.mode,
      });

      send(room.host.ws, TYPES.PEER_JOINED, {
        roomId: room.roomId,
        guestName,
      });
      return;
    }

    if (type === TYPES.SIGNAL) {
      const roomId = payload.roomId;
      const room = roomStore.getRoom(roomId);
      if (!room) {
        send(ws, TYPES.ERROR, { message: "room_not_found" });
        return;
      }

      if (room.host.id !== client.id && room.guest?.id !== client.id) {
        send(ws, TYPES.ERROR, { message: "forbidden" });
        return;
      }

      relaySignal(client, room, payload.signal);
      return;
    }

    send(ws, TYPES.ERROR, { message: "unsupported_type" });
  });

  ws.on("close", () => {
    const removed = roomStore.removeClient(client.id);
    if (!removed) return;

    const { room, role } = removed;
    if (role === "host") {
      if (room.guest) {
        send(room.guest.ws, TYPES.PEER_LEFT, { roomId: room.roomId });
      }
      return;
    }

    send(room.host.ws, TYPES.PEER_LEFT, { roomId: room.roomId });
  });
});

setInterval(() => roomStore.prune(ROOM_TTL_MS), 1000 * 60 * 5);

console.log(`[signaling] listening on ws://localhost:${PORT}`);
