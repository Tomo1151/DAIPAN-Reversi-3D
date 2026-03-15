import * as THREE from "three";
import * as Event from "./Event.js";
import { Disk } from "./Object.js";
import { sleep } from "./Utils.js";
import GameManager from "./GameManager.js";
import GameSection from "./section/GameSection/GameSection.js";
import Player from "./Player.js";

export default class DOMManager {
  #gameManager;
  #rendererManager;
  #cameraManager;
  #titleScreenDOM;
  #namePageDOM;
  #modePageDOM;
  #roomListPageDOM;
  #startButton;
  #nextButton;
  #backToNameButton;
  #backToModeButton;
  #playerNameInput;
  #playerNameErrorDOM;
  #multiplayerGameModeCheckbox;
  #createRoomButton;
  #joinRoomButton;
  #refreshRoomButton;
  #hostLobbyDOM;
  #guestLobbyDOM;
  #roomListContainerDOM;
  #roomListDOM;
  #roomListStatusDOM;
  #hostRoomIdDOM;
  #hostLobbyStatusDOM;
  #guestRoomTargetDOM;
  #guestLobbyStatusDOM;
  #playerInfoDOM;
  #playerInfoModeDOM;
  #playerInfoNameDOM;
  #playerInfoColorDOM;

  #ingameUIContainer;
  #cutDOM;
  #ingameButtons;
  // #putButton;
  #passButton;
  #bangButton;

  #resultScreenDOM;
  #restartButton;

  #playerAngerDOM;
  #shareLink;
  #remoteBangCutinShown = false;

  #DOMEventController;

  constructor(gameManager, rendererManager, cameraManager) {
    this.#gameManager = gameManager;
    this.#rendererManager = rendererManager;
    this.#cameraManager = cameraManager;

    this.#titleScreenDOM = document.getElementById("title_screen");
    this.#namePageDOM = document.getElementById("name_page");
    this.#modePageDOM = document.getElementById("mode_page");
    this.#roomListPageDOM = document.getElementById("room_list_page");
    this.#nextButton = document.getElementById("next_button");
    this.#backToNameButton = document.getElementById("back_to_name_button");
    this.#backToModeButton = document.getElementById("back_to_mode_button");
    this.#playerNameInput = document.getElementById("player_name");
    this.#playerNameErrorDOM = document.getElementById("player_name_error");
    this.#multiplayerGameModeCheckbox = document.getElementById(
      "multiplayer_game_mode",
    );
    this.#startButton = document.getElementById("start_button");
    this.#createRoomButton = document.getElementById("create_room_button");
    this.#joinRoomButton = document.getElementById("join_room_button");
    this.#refreshRoomButton = document.getElementById("refresh_room_button");
    this.#hostLobbyDOM = document.getElementById("host_lobby");
    this.#guestLobbyDOM = document.getElementById("guest_lobby");
    this.#roomListContainerDOM = document.getElementById("room_list_container");
    this.#roomListDOM = document.getElementById("room_list");
    this.#roomListStatusDOM = document.getElementById("room_list_status");
    this.#hostRoomIdDOM = document.getElementById("host_room_id");
    this.#hostLobbyStatusDOM = document.getElementById("host_lobby_status");
    this.#guestRoomTargetDOM = document.getElementById("guest_room_target");
    this.#guestLobbyStatusDOM = document.getElementById("guest_lobby_status");
    this.#playerInfoDOM = document.getElementById("player_info");
    this.#playerInfoModeDOM = document.getElementById("player_info_mode");
    this.#playerInfoNameDOM = document.getElementById("player_info_name");
    this.#playerInfoColorDOM = document.getElementById("player_info_color");
    this.#ingameUIContainer = document.getElementById("ingame_ui");
    this.#cutDOM = document.getElementById("cut");
    this.#ingameButtons = document.getElementById("action_button");
    [this.#passButton, this.#bangButton] = this.#ingameButtons.children;
    this.#resultScreenDOM = document.getElementById("result_screen");
    this.#restartButton = document.getElementById("restart_button");
    this.#playerAngerDOM = document.getElementById("meter_value");
    this.#playerAngerDOM.style.height = `0%`;
    this.#shareLink = document.getElementById("share_button");
    this.hide(this.#bangButton);
    this.showNamePage();

    this.#DOMEventController = new AbortController();

    this.#gameManager.addEventListener("turn_notice", (e) => {
      if (e.order != this.#gameManager.player.order) return;
      // console.log(this.#gameManager.player);

      if (e.canPut) {
        // this.#putButton.classList.remove('disabled');
        this.#passButton.classList.add("disabled");
        this.#bangButton.classList.remove("disabled");
        if (
          this.#gameManager.player.anger >= this.#gameManager.player.patience
        ) {
          this.show(this.#bangButton);
          this.show(document.getElementById("steam_left"));
          this.show(document.getElementById("steam_right"));
        }
      } else {
        // this.#putButton.classList.add('disabled');
        this.#passButton.classList.remove("disabled");
        this.#bangButton.classList.add("disabled");
      }
    });

    this.#gameManager.addEventListener("put_success", (e) => {
      if (e.order == this.#gameManager.player.order) {
        // this.#putButton.classList.add('disabled');
        this.#passButton.classList.add("disabled");
        this.#bangButton.classList.add("disabled");
      }
    });

    this.#gameManager.addEventListener("bang_success", (e) => {
      if (e.order == this.#gameManager.player.order) {
        // this.#putButton.classList.add('disabled');
        this.#passButton.classList.add("disabled");
        this.#bangButton.classList.add("disabled");
        this.#gameManager.currentSection.mode = GameSection.MODE_PUT;
        this.show(this.#ingameButtons);
        this.hide(document.getElementById("steam_left"));
        this.hide(document.getElementById("steam_right"));
      } else {
        this.#remoteBangCutinShown = false;
      }
    });

    this.#gameManager.addEventListener("bang_preview", async (e) => {
      if (!this.#gameManager.isOnlineMode) return;
      if (e.order === this.#gameManager.player.order) return;
      if (this.#gameManager.currentTurn !== e.order) return;
      if (this.#remoteBangCutinShown) return;

      this.#remoteBangCutinShown = true;
      await this.cutin("台パン発動！", this.#gameManager.audio.bang_cut, 1000);
    });

    this.#gameManager.addEventListener("game_over", async (e) => {
      // await sleep(1500);
      // this.#putButton.classList.remove('active');
      // this.#putButton.classList.add('disabled');
      this.#bangButton.classList.remove("active");
      this.#bangButton.classList.add("disabled");

      this.hide(this.#ingameUIContainer);
      await sleep(50);
      await this.cutin("ゲーム終了", this.#gameManager.audio.start, 2000);
      await sleep(750);
      // console.log(e.result);
      this.createShareLink(e.result.result);
      this.drawResultScreen(e.result);
    });

    this.#gameManager.addEventListener("game_restart", () => {
      this.#gameManager.logger.log("GAME RESTART");
      // console.log('GAME RESTART');
      this.hide(this.#resultScreenDOM);
      this.hide(this.#ingameUIContainer);
      this.show(this.#titleScreenDOM);
      this.showNamePage();
      this.hide(this.#playerInfoDOM);
    });
  }

  dispose() {
    this.#DOMEventController.abort();
  }

  addDOMEventListeners() {
    const cautionScreen = document.getElementById("caution_screen");
    const onOrientationChange = () => {
      let width = window.innerWidth;
      let height = window.innerHeight;
      if (width < height) [width, height] = [height, width];
      document.getElementById("main-canvas").style.width = width;
      document.getElementById("main-canvas").style.height = height;

      this.#rendererManager.renderer.setSize(
        window.innerWidth,
        window.innerHeight,
      );
      this.#rendererManager.renderer.setPixelRatio(window.devicePixelRatio);
      this.#rendererManager.camera.aspect =
        window.innerWidth / window.innerHeight;
      this.#rendererManager.camera.updateProjectionMatrix();
    };

    screen.orientation.addEventListener(
      "change",
      () => {
        if (!screen.orientation.type.includes("landscape")) {
          this.show(cautionScreen, true);
        } else {
          onOrientationChange();
          this.hide(cautionScreen);
        }
      },
      { signal: this.#DOMEventController.signal },
    );

    // def Game Events
    this.#nextButton.addEventListener(
      "click",
      () => {
        if (!this.ensurePlayerName()) return;
        this.showModePage();
      },
      { signal: this.#DOMEventController.signal },
    );

    this.#backToNameButton.addEventListener(
      "click",
      () => {
        this.showNamePage();
      },
      { signal: this.#DOMEventController.signal },
    );

    this.#backToModeButton.addEventListener(
      "click",
      () => {
        this.showModePage();
      },
      { signal: this.#DOMEventController.signal },
    );

    this.#playerNameInput.addEventListener(
      "input",
      () => {
        if (this.#playerNameInput.value.trim().length > 0) {
          this.hide(this.#playerNameErrorDOM);
        }
      },
      { signal: this.#DOMEventController.signal },
    );

    this.#startButton.addEventListener(
      "click",
      async () => {
        if (!this.ensurePlayerName()) {
          this.showNamePage();
          return;
        }
        this.hideLobbyScreens();
        // Setting DOMs
        this.#gameManager.logger.log("* send: game_start");
        // console.log("* send: game_start");console.log("");
        this.orderUpdate();
        this.hide(this.#titleScreenDOM);

        this.#gameManager.audio.open.play();
        await this.cutin("ゲームスタート", this.#gameManager.audio.start, 2000);

        this.show(this.#ingameUIContainer);

        this.#gameManager.dispatchEvent(
          new Event.GameStartEvent({ mode: GameManager.MATCH_LOCAL }),
        );
        this.#gameManager.mode = document.getElementById("game_mode").checked
          ? GameManager.MODE_HOTHEADED
          : GameManager.MODE_NORMAL;
        if (this.#gameManager.mode === GameManager.MODE_HOTHEADED)
          this.#gameManager.player.patience = 10;
        // console.log(this.#gameManager.player)
        // console.log(`MODE: ${this.#gameManager.mode == 0? "normal" : "hotheaded"}`);
        document.getElementById("boiling_point").style.bottom =
          `${this.#gameManager.player.patience}%`;
      },
      { signal: this.#DOMEventController.signal },
    );

    this.#createRoomButton.addEventListener(
      "click",
      async () => {
        const playerName = this.getPlayerName();
        if (!playerName) {
          this.showNamePage();
          return;
        }
        this.hide(this.#roomListContainerDOM);
        this.hide(this.#guestLobbyDOM);
        this.show(this.#hostLobbyDOM);
        this.#gameManager.mode = this.#multiplayerGameModeCheckbox?.checked
          ? GameManager.MODE_HOTHEADED
          : GameManager.MODE_NORMAL;
        this.setLobbyStatus("部屋を作成中...");
        try {
          await this.#gameManager.createOnlineRoom(playerName);
        } catch (error) {
          this.setLobbyStatus(
            error?.message ||
              "部屋作成に失敗しました。シグナリングサーバーを確認してください",
          );
        }
      },
      { signal: this.#DOMEventController.signal },
    );

    this.#joinRoomButton.addEventListener(
      "click",
      async () => {
        const playerName = this.getPlayerName();
        if (!playerName) {
          this.showNamePage();
          return;
        }
        this.showRoomListPage();
        this.#gameManager.mode = this.#multiplayerGameModeCheckbox?.checked
          ? GameManager.MODE_HOTHEADED
          : GameManager.MODE_NORMAL;
        this.setLobbyStatus("部屋一覧を取得中...");
        try {
          await this.#gameManager.refreshRoomList();
        } catch (error) {
          this.setLobbyStatus(
            error?.message ||
              "部屋一覧の取得に失敗しました。シグナリングサーバーを確認してください",
          );
          return;
        }
        if (this.#roomListDOM.children.length === 0) {
          this.setLobbyStatus("参加可能な部屋がありません");
        }
        this.#roomListDOM.dataset.playerName = playerName;
      },
      { signal: this.#DOMEventController.signal },
    );

    this.#refreshRoomButton.addEventListener(
      "click",
      async () => {
        try {
          await this.#gameManager.refreshRoomList();
        } catch (error) {
          this.setLobbyStatus(
            error?.message ||
              "部屋一覧の更新に失敗しました。シグナリングサーバーを確認してください",
          );
        }
      },
      { signal: this.#DOMEventController.signal },
    );

    /*
     * GameSection
     */

    // this.#putButton.addEventListener('click', () => {
    // 	if (this.#gameManager.currentTurn != this.#gameManager.player.order) return;
    // 	this.#bangButton.classList.remove('active');
    // 	this.#putButton.classList.toggle('active');
    // 	this.#gameManager.currentSection.toggleMode(GameSection.MODE_PUT);
    // }, { signal: this.#DOMEventController.signal });

    this.#passButton.addEventListener(
      "click",
      () => {
        if (
          this.#gameManager.currentTurn != this.#gameManager.player.order ||
          this.#gameManager.checkTable(this.#gameManager.player.order)
        )
          return;
        this.#gameManager.dispatchEvent(
          new Event.PutPassEvent(this.#gameManager.player.order),
        );
        this.#passButton.classList.add("disabled");
      },
      { signal: this.#DOMEventController.signal },
    );

    this.#bangButton.addEventListener(
      "click",
      async () => {
        if (this.#gameManager.currentTurn != this.#gameManager.player.order)
          return;
        // this.#putButton.classList.remove('active');
        // this.#bangButton.classList.toggle('active');
        this.hide(this.#ingameButtons);
        this.hide(this.#bangButton);
        this.#gameManager.currentSection.mode = GameSection.MODE_BANG;
        this.#cameraManager.moveTo(
          0,
          100,
          0,
          new THREE.Vector3(0, 0, 0),
          false,
          () => {},
          20,
        );
        await this.cutin("たたけ！", this.#gameManager.audio.bang_cut, 1000);
      },
      { signal: this.#DOMEventController.signal },
    );

    /*
     * ResultSection
     */
    this.#restartButton.addEventListener(
      "click",
      (e) => {
        this.#gameManager.dispatchEvent(new Event.GameRestartEvent());
      },
      { signal: this.#DOMEventController.signal },
    );
  }

  drawResultScreen(result) {
    let resultWinner = document.getElementById("winner");
    let resultScore = document.getElementById("score");
    let resultNameBlack = document.getElementById("order_black_name");
    let resultNameWhite = document.getElementById("order_white_name");
    let resultBlack = document.getElementById("order_black");
    let resultWhite = document.getElementById("order_white");
    let resultTime = document.getElementById("time");
    const playerName = this.#gameManager.player.name || "Player";
    const enemyName = this.#gameManager.enemy.name || "Opponent";
    const playerOrder = this.#gameManager.player.order;
    const blackName = playerOrder === Disk.BLACK ? playerName : enemyName;
    const whiteName = playerOrder === Disk.WHITE ? playerName : enemyName;
    const selfScore = playerOrder === Disk.BLACK ? result.black : result.white;
    const maxLength = Math.max(3, blackName.length, whiteName.length);

    let dt =
      this.#gameManager.endTime.getTime() -
      this.#gameManager.startTime.getTime();
    let dh = dt / (1000 * 60 * 60);
    let dm = (dh - Math.floor(dh)) * 60;
    let ds = (dm - Math.floor(dm)) * 60;

    let result_str = "";

    this.show(this.#resultScreenDOM);

    if (result.result == Disk.EMPTY) {
      result_str = "引き分け!";
    } else {
      result_str = `${result.result == playerOrder ? playerName : enemyName}の勝ち!`;
      if (result.reason === "disconnect") {
        result_str += " (切断)";
      }
    }

    resultWinner.innerText = result_str;
    resultScore.innerText = this.#gameManager.isOnlineMode
      ? selfScore
      : this.#gameManager.player.point;
    resultNameWhite.innerText = whiteName;
    resultNameWhite.style.width = `${maxLength + 1}rem`;
    resultWhite.innerText = ` : ${result.white}`;
    resultNameBlack.innerText = blackName;
    resultNameBlack.style.width = `${maxLength + 1}rem`;
    resultBlack.innerText = ` : ${result.black}`;
    resultTime.innerText = `${("00" + Math.floor(dh)).slice(-2)}:${("00" + Math.floor(dm)).slice(-2)}:${("00" + Math.round(ds)).slice(-2)}`;
  }

  createShareLink(result) {
    const result_str = [" 勝利😎", " 敗北☹️", " 引き分け😶"];
    const score = this.#gameManager.player.point;
    const text = `台パンリバーシで${score}点を取ったよ！ [${result_str[result]}]\n`;
    const link = `http://twitter.com/share?url=reversi.syntck.com&text=${text}&hashtags=台パンリバーシ`;
    this.#shareLink.setAttribute("href", link);
  }

  async cutin(str, sound, ms) {
    this.#cutDOM.children[0].innerText = str;
    this.show(this.#cutDOM);
    this.#cutDOM.classList.add("fadeIn");
    await sleep((ms / 10) * 1);
    sound.pause();
    sound.currentTime = 0;
    sound.play();
    await sleep((ms / 10) * 9);
    this.hide(this.#cutDOM);
    this.#cutDOM.classList.remove("fadeIn");
  }

  show(dom, isFlex = false) {
    if (isFlex) {
      dom.style.display = "flex";
    } else {
      dom.style.display = "block";
    }
  }

  getPlayerName() {
    const name = this.#playerNameInput.value.trim();
    return name.length > 0 ? name : null;
  }

  ensurePlayerName() {
    const playerName = this.getPlayerName();
    if (playerName) {
      this.hide(this.#playerNameErrorDOM);
      return true;
    }
    this.show(this.#playerNameErrorDOM);
    return false;
  }

  showNamePage() {
    this.show(this.#namePageDOM);
    this.hide(this.#modePageDOM);
    this.hide(this.#roomListPageDOM);
    this.hideLobbyScreens();
    this.#roomListStatusDOM.innerText = "部屋を選択してください";
  }

  showModePage() {
    this.hide(this.#namePageDOM);
    this.show(this.#modePageDOM);
    this.hide(this.#roomListPageDOM);
  }

  showRoomListPage() {
    this.hide(this.#namePageDOM);
    this.hide(this.#modePageDOM);
    this.show(this.#roomListPageDOM);
    this.hide(this.#hostLobbyDOM);
    this.hide(this.#guestLobbyDOM);
    this.show(this.#roomListContainerDOM);
  }

  hideTitle() {
    this.hide(this.#titleScreenDOM);
  }

  showIngameUI() {
    this.show(this.#ingameUIContainer);
  }

  updatePlayerInfo(players, isOnlineMode) {
    const modeLabel = isOnlineMode ? "MULTI" : "SINGLE";
    const sortedPlayers = [...(players || [])].sort(
      (a, b) => a.order - b.order,
    );
    const playerLines = sortedPlayers.map((player) => {
      const colorLabel = player.order === Disk.BLACK ? "黒" : "白";
      return `${colorLabel}: ${player.name || "Player"}`;
    });
    this.#playerInfoModeDOM.innerText = modeLabel;
    this.#playerInfoNameDOM.innerHTML = playerLines.join("<br>");
    this.#playerInfoColorDOM.innerText = "";
    this.show(this.#playerInfoDOM);
  }

  hideLobbyScreens() {
    this.hide(this.#hostLobbyDOM);
    this.hide(this.#guestLobbyDOM);
    this.hide(this.#roomListContainerDOM);
  }

  showHostLobby(roomId, hostName) {
    this.hide(this.#roomListContainerDOM);
    this.hide(this.#guestLobbyDOM);
    this.show(this.#hostLobbyDOM);
    this.#hostRoomIdDOM.innerText = `Room ID: ${roomId}`;
    this.#hostLobbyStatusDOM.innerText = `${hostName}の部屋で待機中`;
  }

  showGuestLobby(roomId, hostName) {
    this.showRoomListPage();
    this.hide(this.#roomListContainerDOM);
    this.hide(this.#hostLobbyDOM);
    this.show(this.#guestLobbyDOM);
    this.#guestRoomTargetDOM.innerText = `接続先: ${hostName} (${roomId})`;
    this.#guestLobbyStatusDOM.innerText = "P2P接続を確立中...";
  }

  setLobbyStatus(text) {
    if (this.#roomListContainerDOM.style.display !== "none") {
      this.#roomListStatusDOM.innerText = text;
    }
    if (this.#hostLobbyDOM.style.display !== "none") {
      this.#hostLobbyStatusDOM.innerText = text;
    }
    if (this.#guestLobbyDOM.style.display !== "none") {
      this.#guestLobbyStatusDOM.innerText = text;
    }
  }

  renderRoomList(rooms) {
    this.#roomListDOM.innerHTML = "";
    if (!rooms.length) {
      this.#roomListStatusDOM.innerText = "参加可能な部屋がありません";
      return;
    }
    this.#roomListStatusDOM.innerText = "参加する部屋を選択してください";

    const playerName =
      this.#roomListDOM.dataset.playerName || this.getPlayerName();
    for (const room of rooms) {
      const item = document.createElement("li");
      const roomLabel = document.createElement("span");
      const modeLabel =
        room.mode === GameManager.MODE_HOTHEADED ? "短気" : "通常";
      roomLabel.innerText = `${room.hostName} (${room.roomId}) / ${modeLabel}`;

      const joinButton = document.createElement("div");
      joinButton.className = "button";
      joinButton.innerHTML = "<p>参加</p>";
      joinButton.addEventListener("click", async () => {
        if (!playerName) {
          this.showNamePage();
          return;
        }
        this.setLobbyStatus("参加リクエスト送信中...");
        await this.#gameManager.joinOnlineRoom(room.roomId, playerName);
      });

      item.appendChild(roomLabel);
      item.appendChild(joinButton);
      this.#roomListDOM.appendChild(item);
    }
  }

  orderUpdate() {
    let p = document.getElementById("order");
    if (this.#gameManager.currentTurn == Disk.BLACK) {
      p.children[0].innerText = "黒";
      p.classList.remove("order-white");
      p.classList.add("order-black");
    } else {
      p.children[0].innerText = "白";
      p.classList.remove("order-black");
      p.classList.add("order-white");
    }
  }

  angerUpdate() {
    let angerValue = this.#gameManager.player.anger;
    this.#playerAngerDOM.style.height = `${Math.min(angerValue, 98)}%`;
  }

  hide(dom) {
    dom.style.display = "none";
  }

  modeReset() {
    // this.#putButton.classList.remove('active');
    this.#bangButton.classList.remove("active");
    this.#gameManager.currentSection.mode = GameSection.MODE_NONE;
  }
}
