import { SIGNALING_TYPES } from "./MessageSchema.js";

export default class SignalingClient {
  #url;
  #socket;
  #onMessage;
  #onOpen;
  #onClose;
  #onError;

  constructor(url, handlers = {}) {
    this.#url = url;
    this.#onMessage = handlers.onMessage || (() => {});
    this.#onOpen = handlers.onOpen || (() => {});
    this.#onClose = handlers.onClose || (() => {});
    this.#onError = handlers.onError || (() => {});
  }

  isOpen() {
    return !!this.#socket && this.#socket.readyState === WebSocket.OPEN;
  }

  connect() {
    if (this.isOpen()) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.#socket = new WebSocket(this.#url);
      } catch (error) {
        this.#onError(error);
        reject(error);
        return;
      }

      this.#socket.addEventListener("open", () => {
        this.#onOpen();
        resolve();
      });

      this.#socket.addEventListener("message", (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.#onMessage(msg);
        } catch (error) {
          this.#onError(error);
        }
      });

      this.#socket.addEventListener("close", () => {
        this.#onClose();
      });

      this.#socket.addEventListener("error", (error) => {
        this.#onError(error);
        reject(error);
      });
    });
  }

  disconnect() {
    if (!this.#socket) return;
    this.#socket.close();
  }

  send(type, payload = {}) {
    if (!this.#socket || this.#socket.readyState !== WebSocket.OPEN) {
      throw new Error("Signaling socket is not open");
    }

    this.#socket.send(JSON.stringify({ type, payload }));
  }

  createRoom(name, mode = 0) {
    this.send(SIGNALING_TYPES.CREATE_ROOM, { name, mode });
  }

  listRooms() {
    this.send(SIGNALING_TYPES.LIST_ROOMS, {});
  }

  joinRoom(roomId, name) {
    this.send(SIGNALING_TYPES.JOIN_ROOM, { roomId, name });
  }

  sendSignal(roomId, signal) {
    this.send(SIGNALING_TYPES.SIGNAL, { roomId, signal });
  }
}
