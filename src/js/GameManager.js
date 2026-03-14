import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import RendererManager from "./RendererManager.js";
import SectionManager from "./SectionManager.js";
import DOMManager from "./DOMManager.js";
import CameraManager from "./CameraManager.js";

import TitleSection from "./section/TitleSection/TitleSection.js";
import GameSection from "./section/GameSection/GameSection.js";
import ResultSection from "./section/ResultSection/ResultSection.js";

import Player from "./Player.js";
import Enemy from "./Enemy.js";
import * as Event from "./Event.js";
import { Disk, Board } from "./Object.js";
import Logger from "./Logger.js";
import { sleep } from "./Utils.js";
import SignalingClient from "./network/SignalingClient.js";
import P2PClient from "./network/P2PClient.js";
import {
  SIGNALING_TYPES,
  P2P_TYPES,
  createActionMessage,
} from "./network/MessageSchema.js";

export default class GameManager extends THREE.EventDispatcher {
  static BEFORE_START = 0;
  static IN_GAME = 1;
  static GAME_OVER = 2;

  static MODE_NORMAL = 0;
  static MODE_HOTHEADED = 1;
  static MATCH_LOCAL = "local";
  static MATCH_ONLINE = "online";
  static TURN_TIMEOUT_MS = 90000;

  #isMobile = false;

  GAME_STATE;
  GAME_MODE;
  GAME_PLAY_COUNT = 0;

  #frame;
  #startTime;

  #endTime;
  #scene;
  #currentSection;

  #rendererManager;
  #sectionManager;
  #domManager;
  #cameraManager;
  #logger;

  #board;
  #player;
  #enemy;

  #LU;
  #LD;
  #RU;
  #RD;

  #currentTurn;
  #result;
  #matchMode = GameManager.MATCH_LOCAL;
  #onlineRole = null;
  #matchId = null;
  #signalingUrl = "ws://localhost:8787";
  #signalingClient;
  #p2pClient;
  #networkSeq = 0;
  #lastRemoteSeq = -1;
  #turnTimer = null;
  #remotePlayerName = null;
  #isStartingOnlineMatch = false;

  #objectPool = {
    board: undefined,
    disk: undefined,
  };

  #audio = {
    start: new Audio("./audio/gamestart.mp3"),
    open: new Audio("./audio/open.mp3"),
    put: new Audio("./audio/put__.mp3"),
    flip: new Audio("./audio/flip__.mp3"),
    bang: new Audio("./audio/daipan_audio.mp3"),
    bang_cut: new Audio("./audio/d_cutin.mp3"),
  };

  constructor() {
    super();
    this.modelLoad().then(() => {
      this.init();
      this.disableLoadingScreen();
    });

    const { userAgent, userAgentData } = navigator;
    if (userAgentData == null) {
      this.#isMobile = userAgent.match(/iPhone|Android.+Mobile/) != null;
    } else {
      this.#isMobile = userAgentData.mobile;
    }

    // console.log(this.#isMobile);
  }

  modelLoad() {
    let loadingQueue = { board: false, disk: false };
    const disk_progress = document.getElementById("disk_progress");
    const board_progress = document.getElementById("board_progress");
    const loader = new GLTFLoader();

    return new Promise((res) => {
      // @TODO 読み込みに時間が掛かっている時の処理を書く
      loader.load(
        "model_data/Board_low.gltf",
        (obj) => {
          this.#objectPool.board = obj;
          loadingQueue.board = true;
          if (
            Object.values(loadingQueue).every((v) => {
              return v;
            })
          )
            res();
        },
        (xhr) => {
          // console.log(xhr)
          console.log(
            `[Model loading: Board] ${(xhr.loaded / xhr.total) * 100}% loaded`,
          );
          board_progress.value = (xhr.loaded / xhr.total) * 100;
        },
      );

      loader.load(
        "model_data/Disk.gltf",
        (obj) => {
          this.#objectPool.disk = obj;
          loadingQueue.disk = true;

          if (
            Object.values(loadingQueue).every((v) => {
              return v;
            })
          )
            res();
        },
        (xhr) => {
          // console.log(xhr)
          console.log(
            `[Model loading: Disk] ${(xhr.loaded / xhr.total) * 100}% loaded`,
          );
          disk_progress.value = (xhr.loaded / xhr.total) * 100;
        },
      );
    });
  }

  disableLoadingScreen() {
    const cautionScreen = document.getElementById("caution_screen");
    if (screen.orientation.type.includes("landscape"))
      cautionScreen.style.display = "none";
    const loadingScreen = document.getElementById("loading_screen");
    loadingScreen.style.display = "none";
  }

  run() {
    const tick = () => {
      requestAnimationFrame(tick);
      this.#frame += 1;
      if (this.#isMobile && this.#frame % 2 == 0) return;
      if (this.#currentSection) this.#currentSection.run();
      if (this.#cameraManager) this.#cameraManager.update();
      if (this.#rendererManager && this.#scene)
        this.#rendererManager.render(this.#scene);
    };

    tick();
  }

  init() {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    let runtimeSignalUrl =
      window.__APP_CONFIG__?.SIGNALING_URL || window.SIGNALING_URL || null;
    if (typeof runtimeSignalUrl === "string") {
      runtimeSignalUrl = runtimeSignalUrl.trim();
      if (!runtimeSignalUrl || runtimeSignalUrl.includes("<?php")) {
        runtimeSignalUrl = null;
      }
    }
    this.#signalingUrl =
      params.get("signal") || runtimeSignalUrl || this.#signalingUrl;

    this.#frame = 0;
    this.#scene = new THREE.Scene();

    this.#rendererManager = new RendererManager(this);
    this.#sectionManager = new SectionManager(
      this,
      this.#rendererManager,
      this.#scene,
    );
    this.#cameraManager = new CameraManager(
      this,
      this.#rendererManager,
      this.#scene,
    );
    this.#currentSection = new TitleSection(
      this,
      this.#rendererManager,
      this.#cameraManager,
      this.#scene,
    );
    this.#domManager = new DOMManager(
      this,
      this.#rendererManager,
      this.#cameraManager,
    );
    this.#logger = new Logger(document.getElementById("log"));
    if (params.get("logged") === "true") this.#logger.on();
    this.#logger.enabled = true;
    this.#domManager.addDOMEventListeners();
    this.#sectionManager.changeSection(this.#currentSection);
    this.GAME_STATE = GameManager.BEFORE_START;
    this.#currentTurn = Disk.BLACK;
    this.#matchMode = GameManager.MATCH_LOCAL;
    this.#onlineRole = null;
    this.#networkSeq = 0;
    this.#lastRemoteSeq = -1;
    this.#matchId = null;
    this.#remotePlayerName = null;
    this.clearTurnTimeout();

    this.addIngameListener();
  }

  async ensureSignalingConnection() {
    if (this.#signalingClient?.isOpen()) return;

    if (this.#signalingClient && !this.#signalingClient.isOpen()) {
      this.#signalingClient.disconnect();
      this.#signalingClient = undefined;
    }

    this.#signalingClient = new SignalingClient(this.#signalingUrl, {
      onMessage: (message) => this.handleSignalingMessage(message),
      onOpen: () => this.#logger.log("[NET] signaling connected"),
      onClose: () => {
        this.#logger.log("[NET] signaling closed");
        this.#domManager?.setLobbyStatus(
          "シグナリングサーバーとの接続が切れました",
        );
      },
      onError: (error) => {
        console.error(error);
        this.#domManager?.setLobbyStatus("シグナリングエラーが発生しました");
      },
    });

    try {
      await this.#signalingClient.connect();
    } catch (error) {
      this.#signalingClient = undefined;
      throw new Error(
        `シグナリングサーバーへ接続できません (${this.#signalingUrl})`,
      );
    }
  }

  async createOnlineRoom(playerName) {
    await this.ensureSignalingConnection();
    this.#onlineRole = "host";
    this.#remotePlayerName = null;
    this.#signalingClient.createRoom(
      playerName,
      this.GAME_MODE ?? GameManager.MODE_NORMAL,
    );
  }

  async refreshRoomList() {
    await this.ensureSignalingConnection();
    this.#signalingClient.listRooms();
  }

  async joinOnlineRoom(roomId, playerName) {
    await this.ensureSignalingConnection();
    this.#onlineRole = "guest";
    this.#remotePlayerName = null;
    this.#signalingClient.joinRoom(roomId, playerName);
  }

  setSignalingUrl(url) {
    if (!url) return;
    this.#signalingUrl = url;
  }

  cleanupNetwork() {
    if (this.#p2pClient) {
      this.#p2pClient.close();
      this.#p2pClient = undefined;
    }
    if (this.#signalingClient) {
      this.#signalingClient.disconnect();
      this.#signalingClient = undefined;
    }
    this.#onlineRole = null;
    this.#matchId = null;
    this.#remotePlayerName = null;
    this.#isStartingOnlineMatch = false;
    this.#networkSeq = 0;
    this.#lastRemoteSeq = -1;
    this.clearTurnTimeout();
  }

  async setupP2P(isHost) {
    if (this.#p2pClient) {
      this.#p2pClient.close();
    }

    this.#p2pClient = new P2PClient({
      isHost,
      handlers: {
        onSignal: (signal) => {
          if (!this.#signalingClient || !this.#matchId) return;
          this.#signalingClient.sendSignal(this.#matchId, signal);
        },
        onOpen: () => {
          this.#logger.log("[NET] data channel open");
          this.#domManager?.setLobbyStatus("P2P接続に成功しました");
          if (isHost) {
            this.#p2pClient.send({
              type: P2P_TYPES.MATCH_START,
              payload: {
                matchId: this.#matchId,
                hostName: this.#domManager.getPlayerName() || "HOST",
                guestName: this.#remotePlayerName || "GUEST",
                mode: this.GAME_MODE ?? GameManager.MODE_NORMAL,
              },
            });
            this.startOnlineMatch({
              localOrder: Disk.BLACK,
              remoteName: this.#remotePlayerName || "GUEST",
            });
          }
        },
        onClose: () => this.handlePeerDisconnected(),
        onMessage: (message) => this.handleP2PMessage(message),
        onError: (error) => {
          console.error(error);
          this.#domManager?.setLobbyStatus("P2P通信エラーが発生しました");
        },
      },
    });

    if (isHost) {
      await this.#p2pClient.createOffer();
    }
  }

  handleSignalingMessage(message) {
    const { type, payload = {} } = message;

    switch (type) {
      case SIGNALING_TYPES.ROOM_CREATED:
        this.#matchId = payload.roomId;
        this.GAME_MODE =
          payload.mode ?? this.GAME_MODE ?? GameManager.MODE_NORMAL;
        this.#domManager.showHostLobby(payload.roomId, payload.hostName);
        this.#domManager.setLobbyStatus("参加者を待機中です...");
        break;
      case SIGNALING_TYPES.ROOM_LIST:
        this.#domManager.renderRoomList(payload.rooms || []);
        break;
      case SIGNALING_TYPES.ROOM_JOINED:
        this.#matchId = payload.roomId;
        this.#remotePlayerName = payload.hostName || "HOST";
        this.GAME_MODE =
          payload.mode ?? this.GAME_MODE ?? GameManager.MODE_NORMAL;
        this.#domManager.showGuestLobby(payload.roomId, this.#remotePlayerName);
        this.setupP2P(false);
        break;
      case SIGNALING_TYPES.PEER_JOINED:
        this.#remotePlayerName = payload.guestName || "GUEST";
        this.#domManager.setLobbyStatus(
          `${this.#remotePlayerName} が参加しました。接続中...`,
        );
        this.setupP2P(true);
        break;
      case SIGNALING_TYPES.SIGNAL:
        if (this.#p2pClient) {
          this.#p2pClient.handleSignal(payload.signal);
        }
        break;
      case SIGNALING_TYPES.PEER_LEFT:
        this.#domManager.setLobbyStatus("相手が退出しました");
        this.handlePeerDisconnected();
        break;
      case SIGNALING_TYPES.ERROR:
        this.#domManager.setLobbyStatus(payload.message || "通信エラー");
        break;
    }
  }

  handleP2PMessage(message) {
    const { type, payload = {}, seq = -1 } = message;

    if (seq >= 0) {
      if (seq <= this.#lastRemoteSeq) return;
      this.#lastRemoteSeq = seq;
    }

    switch (type) {
      case P2P_TYPES.MATCH_START:
        if (this.#onlineRole === "guest") {
          this.GAME_MODE =
            payload.mode ?? this.GAME_MODE ?? GameManager.MODE_NORMAL;
          this.startOnlineMatch({
            localOrder: Disk.WHITE,
            remoteName: payload.hostName || "HOST",
          });
        }
        break;
      case P2P_TYPES.ACTION_PUT:
        this.dispatchEvent(
          new Event.PutNoticeEvent({ ...payload, fromRemote: true }),
        );
        break;
      case P2P_TYPES.ACTION_BANG_PREVIEW:
        if (this.GAME_STATE !== GameManager.IN_GAME) break;
        this.dispatchEvent(new Event.BangPreviewEvent(payload));
        break;
      case P2P_TYPES.ACTION_BANG_RESULT:
        if (this.GAME_STATE !== GameManager.IN_GAME) break;
        this.clearTurnTimeout();
        this.applyBangResult(payload.order, payload.pos || []);
        this.dispatchEvent(
          new Event.BangSuccessEvent({
            order: payload.order,
            pos: payload.pos || [],
            impact: payload.impact || null,
          }),
        );
        this.dispatchEvent(new Event.ConfirmationEvent(payload.order));
        break;
      case P2P_TYPES.ACTION_PASS:
        this.dispatchEvent(new Event.PutPassEvent(payload.order, true));
        break;
      case P2P_TYPES.ACTION_RESTART:
        if (this.GAME_STATE === GameManager.GAME_OVER) {
          this.dispatchEvent(new Event.GameRestartEvent(true));
        }
        break;
    }
  }

  async startOnlineMatch({ localOrder, remoteName }) {
    if (
      this.#isStartingOnlineMatch ||
      this.GAME_STATE !== GameManager.BEFORE_START
    )
      return;
    this.#isStartingOnlineMatch = true;
    this.#matchMode = GameManager.MATCH_ONLINE;
    this.#remotePlayerName = remoteName;
    this.#domManager.hideLobbyScreens();
    this.#domManager.orderUpdate();
    this.#domManager.hideTitle();
    this.#audio.open.play();
    await this.#domManager.cutin("ゲームスタート", this.#audio.start, 2000);
    this.#domManager.showIngameUI();
    this.dispatchEvent(
      new Event.GameStartEvent({
        mode: GameManager.MATCH_ONLINE,
        localOrder,
        remoteName,
      }),
    );
    this.#isStartingOnlineMatch = false;
  }

  sendP2PAction(type, payload) {
    if (this.#matchMode !== GameManager.MATCH_ONLINE || !this.#p2pClient)
      return;
    const message = createActionMessage(
      type,
      payload,
      ++this.#networkSeq,
      this.#matchId,
      this.#onlineRole,
    );
    this.#p2pClient.send(message);
  }

  startTurnTimeout(order) {
    this.clearTurnTimeout();
    if (this.#matchMode !== GameManager.MATCH_ONLINE) return;
    this.#turnTimer = setTimeout(() => {
      if (this.GAME_STATE !== GameManager.IN_GAME) return;
      this.forceGameOverByTimeout(order);
    }, GameManager.TURN_TIMEOUT_MS);
  }

  clearTurnTimeout() {
    if (this.#turnTimer) {
      clearTimeout(this.#turnTimer);
      this.#turnTimer = null;
    }
  }

  forceGameOverByTimeout(timeoutOrder) {
    const black = this.#board.count(Disk.BLACK);
    const white = this.#board.count(Disk.WHITE);
    const winner = timeoutOrder === Disk.BLACK ? Disk.WHITE : Disk.BLACK;
    const result = { black, white, result: winner, reason: "timeout" };
    this.dispatchEvent(new Event.GameOverEvent(result));
  }

  handlePeerDisconnected() {
    if (this.GAME_STATE === GameManager.IN_GAME) {
      const winner = this.#player?.order ?? Disk.WHITE;
      const black = this.#board?.count(Disk.BLACK) ?? 0;
      const white = this.#board?.count(Disk.WHITE) ?? 0;
      this.dispatchEvent(
        new Event.GameOverEvent({
          black,
          white,
          result: winner,
          reason: "disconnect",
        }),
      );
    } else {
      this.#domManager.setLobbyStatus(
        "接続が切断されました。タイトルに戻って再試行してください",
      );
    }
  }

  addIngameListener() {
    this.addEventListener("game_start", async (e) => {
      if (this.GAME_STATE != GameManager.BEFORE_START) return;
      // await this.#domManager.cutin("ゲームスタート", this.#audio.start);
      const options = e.options || {};
      const isOnline = options.mode === GameManager.MATCH_ONLINE;

      this.#startTime = e.time;
      this.#board = new Board(8, 8);
      this.#currentSection = new GameSection(
        this,
        this.#rendererManager,
        this.#cameraManager,
        this.#scene,
      );
      this.#sectionManager.changeSection(this.#currentSection);

      this.#logger.log("[Event]: game_start");
      // console.log("[Event]: game_start");
      if (isOnline) {
        this.#matchMode = GameManager.MATCH_ONLINE;
        const localOrder = options.localOrder ?? Disk.WHITE;
        const remoteOrder = localOrder === Disk.BLACK ? Disk.WHITE : Disk.BLACK;
        this.#player = new Player(this, localOrder);
        this.#enemy = new Player(this, remoteOrder);
        this.#player.name = this.#domManager.getPlayerName() || "Player";
        this.#enemy.name =
          options.remoteName || this.#remotePlayerName || "Guest";
        if (this.GAME_MODE === GameManager.MODE_HOTHEADED) {
          this.#player.patience = 10;
        }
      } else {
        this.#matchMode = GameManager.MATCH_LOCAL;
        this.#enemy = new Enemy(this, Disk.BLACK);
        this.#player = new Player(this, Disk.WHITE);
        this.#player.name = this.#domManager.getPlayerName();
        if (this.GAME_MODE === GameManager.MODE_HOTHEADED) {
          this.#player.patience = 10;
        }
      }

      document.getElementById("boiling_point").style.bottom =
        `${this.#player.patience}%`;
      this.#domManager.updatePlayerInfo(
        [
          { name: this.#player.name, order: this.#player.order },
          { name: this.#enemy.name, order: this.#enemy.order },
        ],
        this.#matchMode === GameManager.MATCH_ONLINE,
      );
    });

    this.addEventListener("turn_notice", () => {
      this.#logger.log(
        `@gm > waiting ${this.#currentTurn == Disk.BLACK ? "Enemy" : `${this.#player.name}`}'s response ...`,
      );
      // console.log(`@gm > waiting ${this.#currentTurn == Disk.BLACK ? "Enemy" : `${this.#player.name}`}'s response ...`)
    });

    this.addEventListener("put_notice", (data) => {
      if (this.GAME_STATE != GameManager.IN_GAME) return;

      let order = data.order;
      let x = data.x;
      let y = data.y;

      if (order !== this.#currentTurn) return;

      if (
        this.#matchMode === GameManager.MATCH_ONLINE &&
        !data.fromRemote &&
        order === this.#player.order
      ) {
        this.sendP2PAction(P2P_TYPES.ACTION_PUT, { order, x, y });
      }

      this.#logger.log("gameManager received: put_notice");
      // console.log("gameManager received: put_notice");

      if (this.checkCanPut(x, y)) {
        this.clearTurnTimeout();
        let count = this.countReversible(this.#currentTurn, x, y);
        // this.#logger.log(`count: ${count}`);
        // console.log(`count: ${count}`);
        this.put(x, y);
        this.#logger.log("gameManager send: put_success");
        // console.log("gameManager send: put_success");

        this.checkCorner(order, x, y);
        this.dispatchEvent(
          new Event.PutSuccessEvent(this.#currentTurn, { x, y }, count),
        );
      } else {
        this.#logger.log("gameManager send: put_fail");
        // console.log("gameManager send: put_fail");
        this.dispatchEvent(new Event.PutFailEvent(this.#currentTurn));
      }
    });

    this.addEventListener("bang_notice", (data) => {
      this.#logger.log(`[BANG] x: ${data.x}, y: ${data.y}`);
      // console.log(`[BANG] x: ${data.x}, y: ${data.y}`);
      this.clearTurnTimeout();
      let pos = this.board.raffle(data.order, data.x, data.y, data.anger);
      // console.log(pos);
      for (let p of pos) this.checkCorner(data.order, p.x, p.y);

      if (
        this.#matchMode === GameManager.MATCH_ONLINE &&
        data.order === this.#player.order
      ) {
        this.sendP2PAction(P2P_TYPES.ACTION_BANG_RESULT, {
          order: data.order,
          pos,
          impact: { x: data.x, y: data.y },
        });
      }

      this.dispatchEvent(
        new Event.BangSuccessEvent({
          order: this.#currentTurn,
          pos,
          impact: { x: data.x, y: data.y },
        }),
      );
      // this.#domManager.modeReset();
    });

    this.addEventListener("bang_success", (e) => {
      this.#logger.log("gameManager received: bang_success");
      // console.log("gameManager received: bang_success");
      this.getPlayerFromOrder(e.order).bang += e.pos.length;
    });

    this.addEventListener("confirmed", (e) => {
      this.#logger.log("gameManager received: confirmed");
      // console.log("gameManager received: confirmed");
    });

    this.addEventListener("updated", async () => {
      this.#logger.log("gameManager received: updated");
      // console.log("gameManager received: updated")
      if (this.GAME_STATE == GameManager.BEFORE_START) {
        this.GAME_STATE = GameManager.IN_GAME;
        await sleep(1000);
        this.dispatchEvent(
          new Event.TurnNoticeEvent(Disk.BLACK, this.#board, true),
        );
        this.startTurnTimeout(Disk.BLACK);
      } else if (this.GAME_STATE == GameManager.IN_GAME) {
        await sleep(1000);
        this.dispatchEvent(new Event.TurnChangeEvent());
      }
    });

    this.addEventListener("put_pass", (e) => {
      if (e.order !== this.#currentTurn) return;

      if (
        this.#matchMode === GameManager.MATCH_ONLINE &&
        !e.fromRemote &&
        e.order === this.#player.order
      ) {
        this.sendP2PAction(P2P_TYPES.ACTION_PASS, { order: e.order });
      }

      this.#logger.log("gameManager received: put_pass");
      // console.log("gameManager received: put_pass");
      this.clearTurnTimeout();
      this.dispatchEvent(new Event.TurnChangeEvent());
    });

    this.addEventListener("turn_change", () => {
      // this.#player.retching(100)
      this.#logger.log("gameManager received: turn_change");
      // console.log("gameManager received: turn_change");console.log("");
      // this.player.retching(10);

      this.#currentTurn == Disk.BLACK
        ? (this.#currentTurn = Disk.WHITE)
        : (this.#currentTurn = Disk.BLACK);
      this.#domManager.orderUpdate();
      this.angerUpdate();

      if (this.checkGameOver()) {
        this.clearTurnTimeout();
        this.#result = this.getResult();
        this.dispatchEvent(new Event.GameOverEvent(this.#result));
      } else {
        this.#logger.log(
          `[${this.#currentTurn == Disk.BLACK ? "Enemy's" : `${this.#player.name}'s`} turn]`,
        );
        // console.log(`[${this.#currentTurn == Disk.BLACK ? "Enemy's" : `${this.#player.name}'s`} turn]`);
        this.dispatchEvent(
          new Event.TurnNoticeEvent(
            this.#currentTurn,
            this.#board,
            this.checkTable(this.#currentTurn),
          ),
        );
        this.startTurnTimeout(this.#currentTurn);
      }
    });

    this.addEventListener("game_over", async (e) => {
      if (this.GAME_STATE != GameManager.IN_GAME) return;
      this.GAME_STATE = GameManager.GAME_OVER;
      this.clearTurnTimeout();
      this.#endTime = e.time;
      this.#result = e.result;
      this.calcScore(e);
      if (this.#matchMode === GameManager.MATCH_LOCAL) {
        this.sendResult(e);
      }
      await sleep(1000);
      this.#currentSection = new ResultSection(
        this,
        this.#rendererManager,
        this.#cameraManager,
        this.#scene,
        this.#result,
      );
      this.#sectionManager.changeSection(this.#currentSection);
    });

    this.addEventListener("game_restart", (e) => {
      if (this.GAME_STATE != GameManager.GAME_OVER) return;
      if (this.#matchMode === GameManager.MATCH_ONLINE && !e.fromRemote) {
        this.sendP2PAction(P2P_TYPES.ACTION_RESTART, { ok: true });
      }
      this.GAME_PLAY_COUNT++;
      this.restart();
    });
  }

  angerUpdate() {
    this.#domManager.angerUpdate();
  }

  restart() {
    this.#domManager?.dispose?.();
    this.cleanupNetwork();
    this._listeners = {};
    this.init();
  }

  checkGameOver() {
    if (!this.checkTable(Disk.BLACK) && !this.checkTable(Disk.WHITE)) {
      return true;
    } else {
      return false;
    }
  }

  checkTable(order) {
    for (let i = 0; i < this.#board.height; i++) {
      for (let j = 0; j < this.#board.width; j++) {
        if (this.#board.putJudgement(order, j, i)) {
          return true;
        }
      }
    }
    return false;
  }

  checkCanPut(x, y) {
    return this.#board.putJudgement(this.#currentTurn, x, y);
  }

  checkCorner(order, x, y) {
    const corner = {
      0: { 0: "LU", 7: "LD" },
      7: { 0: "RU", 7: "RD" },
    };

    try {
      let c = corner[x][y];
      if (c) {
        console.log(
          `${c} was taken by ${order == Disk.WHITE ? "white" : "black"}`,
        );
        this.dispatchEvent(new Event.TakeCornerEvent(order, c));
      }
    } catch {}
  }

  applyBangResult(order, positions) {
    for (const pos of positions) {
      const disk = this.#board.getDisk(pos.x, pos.y);
      if (!disk || disk.state === Disk.EMPTY) continue;
      disk.reverse();
      this.checkCorner(order, pos.x, pos.y);
    }
  }

  put(x, y) {
    this.#board.putDisk(this.#currentTurn, x, y);
  }

  countReversible(order, x, y) {
    const dr = [-1, -1, -1, 0, 0, 1, 1, 1];
    const dc = [-1, 0, 1, -1, 1, -1, 0, 1];
    let count = 0;

    for (let i = 0; i < 8; i++) {
      count += this.#board.countReversible(order, x, y, dc[i], dr[i]);
    }

    return count;
  }

  calcScore(e) {
    const time = Math.round((this.endTime - this.startTime) / 1000);
    const myDiskCount =
      this.#player.order === Disk.BLACK ? e.result.black : e.result.white;
    this.#player.point += myDiskCount * 12.5;
    // this.#player.point += (e.result.result == this.#player.order) ? 1250 : 600;
    this.#player.point += this.#player.bang * 10;
    this.#player.point += Math.max(360 - time, 0);
    const corners = [
      { x: 0, y: 0 },
      { x: 0, y: 7 },
      { x: 7, y: 0 },
      { x: 7, y: 7 },
    ];
    // console.log("台パンで" + this.player.bang + "個の石をひっくり返した");
    // console.log(e);
    for (let pos of corners) {
      const order = this.board.getDisk(pos.x, pos.y).state;
      // console.log(order);
      if (order !== Disk.EMPTY) this.getPlayerFromOrder(order).point += 250;
    }

    let includeEmpty = false;
    if (e.result.result == this.#player.order) {
      this.#player.point += 1250;
      for (let disk of this.board.table) {
        // console.log(disk);
        if (disk.state == Disk.EMPTY) includeEmpty = true;
      }
    } else {
      this.#player.point += 600;
    }

    if (includeEmpty) this.#player.point += 320;

    this.#player.point = Math.floor(this.#player.point);
    return this.#player.point;
  }

  sendResult(e) {
    const form = new FormData();
    const time = Math.round((this.endTime - this.startTime) / 1000);
    const token = document.getElementById("token").value;
    form.append("token", token);
    if (this.player.name !== null) form.append("name", this.player.name);
    form.append("board", JSON.stringify(this.board.table));
    form.append("bang", this.player.bang);
    form.append("score", this.player.point);
    form.append("gc", this.GAME_PLAY_COUNT);
    form.append("mode", this.GAME_MODE);
    form.append("time", time);
    form.append("gametime", Math.round((this.endTime - this.startTime) / 1000));
    form.append("result", e.result.result);

    const params = {
      method: "POST",
      body: form,
    };

    fetch("php/score_registration.php", params)
      .then((response) => response.json())
      .then((res) => {
        // console.log(`res:`);
        console.log(res);
      });
  }

  getResult() {
    let black = this.#board.count(Disk.BLACK);
    let white = this.#board.count(Disk.WHITE);
    let result = black < white ? Disk.WHITE : Disk.BLACK;
    if (black == white) result = Disk.EMPTY;
    return { black, white, result };
  }

  getPlayerFromOrder(order) {
    if (order == Disk.WHITE) {
      return this.#player;
    } else if (order == Disk.BLACK) {
      return this.#enemy;
    }
  }

  get isMobile() {
    return this.#isMobile;
  }
  get objects() {
    return this.#objectPool;
  }
  get audio() {
    return this.#audio;
  }
  get player() {
    return this.#player;
  }
  get enemy() {
    return this.#enemy;
  }
  get currentTurn() {
    return this.#currentTurn;
  }
  get LU() {
    return this.#LU;
  }
  get LD() {
    return this.#LD;
  }
  get RU() {
    return this.#RU;
  }
  get RD() {
    return this.#RD;
  }
  get currentSection() {
    return this.#currentSection;
  }
  get board() {
    return this.#board;
  }
  get mode() {
    return this.GAME_MODE;
  }
  set mode(mode) {
    this.GAME_MODE = mode;
  }
  get startTime() {
    return this.#startTime;
  }
  get endTime() {
    return this.#endTime;
  }
  get logger() {
    return this.#logger;
  }
  get isOnlineMode() {
    return this.#matchMode === GameManager.MATCH_ONLINE;
  }
  get remotePlayerName() {
    return this.#remotePlayerName;
  }
}
