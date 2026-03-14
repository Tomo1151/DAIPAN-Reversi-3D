function createRoomId(existingRooms) {
  let roomId = "";
  do {
    roomId = Math.random().toString(36).slice(2, 8).toUpperCase();
  } while (existingRooms.has(roomId));
  return roomId;
}

export default class RoomStore {
  #rooms = new Map();

  createRoom(host, mode = 0) {
    const roomId = createRoomId(this.#rooms);
    const room = {
      roomId,
      host,
      mode,
      guest: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.#rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId) {
    return this.#rooms.get(roomId);
  }

  joinRoom(roomId, guest) {
    const room = this.#rooms.get(roomId);
    if (!room) return { ok: false, reason: "room_not_found" };
    if (room.guest) return { ok: false, reason: "room_full" };
    if (room.host.id === guest.id) return { ok: false, reason: "same_client" };

    room.guest = guest;
    room.updatedAt = Date.now();
    return { ok: true, room };
  }

  listJoinableRooms() {
    return [...this.#rooms.values()]
      .filter((room) => !room.guest)
      .map((room) => ({
        roomId: room.roomId,
        hostName: room.host.name,
        mode: room.mode,
      }));
  }

  removeClient(clientId) {
    for (const [roomId, room] of this.#rooms.entries()) {
      if (room.host.id === clientId) {
        this.#rooms.delete(roomId);
        return { room, role: "host" };
      }

      if (room.guest && room.guest.id === clientId) {
        room.guest = null;
        room.updatedAt = Date.now();
        return { room, role: "guest" };
      }
    }

    return null;
  }

  prune(ttlMs) {
    const now = Date.now();
    for (const [roomId, room] of this.#rooms.entries()) {
      if (now - room.updatedAt > ttlMs) {
        this.#rooms.delete(roomId);
      }
    }
  }
}
