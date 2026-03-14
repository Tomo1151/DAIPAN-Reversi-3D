export default class P2PClient {
  #pc;
  #channel;
  #isHost;
  #onSignal;
  #onOpen;
  #onClose;
  #onMessage;
  #onError;

  constructor({
    isHost = false,
    iceServers = [{ urls: "stun:stun.l.google.com:19302" }],
    handlers = {},
  } = {}) {
    this.#isHost = isHost;
    this.#onSignal = handlers.onSignal || (() => {});
    this.#onOpen = handlers.onOpen || (() => {});
    this.#onClose = handlers.onClose || (() => {});
    this.#onMessage = handlers.onMessage || (() => {});
    this.#onError = handlers.onError || (() => {});

    this.#pc = new RTCPeerConnection({ iceServers });
    this.#pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.#onSignal({ candidate: event.candidate });
      }
    };

    this.#pc.onconnectionstatechange = () => {
      if (
        this.#pc.connectionState === "failed" ||
        this.#pc.connectionState === "disconnected" ||
        this.#pc.connectionState === "closed"
      ) {
        this.#onClose();
      }
    };

    if (this.#isHost) {
      this.#channel = this.#pc.createDataChannel("reversi-match", {
        ordered: true,
      });
      this.#bindDataChannel(this.#channel);
    } else {
      this.#pc.ondatachannel = (event) => {
        this.#channel = event.channel;
        this.#bindDataChannel(this.#channel);
      };
    }
  }

  #bindDataChannel(channel) {
    channel.onopen = () => this.#onOpen();
    channel.onclose = () => this.#onClose();
    channel.onerror = (error) => this.#onError(error);
    channel.onmessage = (event) => {
      try {
        this.#onMessage(JSON.parse(event.data));
      } catch (error) {
        this.#onError(error);
      }
    };
  }

  async createOffer() {
    const offer = await this.#pc.createOffer();
    await this.#pc.setLocalDescription(offer);
    this.#onSignal({ description: this.#pc.localDescription });
  }

  async handleSignal(signal) {
    if (signal.description) {
      const description = signal.description;
      await this.#pc.setRemoteDescription(description);

      if (description.type === "offer") {
        const answer = await this.#pc.createAnswer();
        await this.#pc.setLocalDescription(answer);
        this.#onSignal({ description: this.#pc.localDescription });
      }
      return;
    }

    if (signal.candidate) {
      try {
        await this.#pc.addIceCandidate(signal.candidate);
      } catch (error) {
        this.#onError(error);
      }
    }
  }

  send(message) {
    if (!this.#channel || this.#channel.readyState !== "open") {
      throw new Error("Data channel is not open");
    }
    this.#channel.send(JSON.stringify(message));
  }

  close() {
    if (this.#channel) this.#channel.close();
    if (this.#pc) this.#pc.close();
  }
}
