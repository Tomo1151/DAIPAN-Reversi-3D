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

export default class GameManager extends THREE.EventDispatcher {
	static BEFORE_START = 0;
	static IN_GAME = 1;
	static GAME_OVER = 2;

	GAME_STATE;
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

	#objectPool = {
		"board": undefined,
		"disk": undefined
	};

	#audio = {
		start: new Audio('./audio/gamestart.mp3'),
		open: new Audio('./audio/open.mp3'),
		put: new Audio('./audio/put__.mp3'),
		flip: new Audio('./audio/flip__.mp3'),
		bang: new Audio('./audio/daipan_audio.mp3'),
		bang_cut: new Audio('./audio/d_cutin.mp3')
	};

	constructor() {
		super();
		this.modelLoad().then(() => {
			this.init();
			this.disableLoadingScreen();
		});
	}

	modelLoad() {
		let loadingQueue = {"board": false, "disk": false};
		const disk_progress = document.getElementById('disk_progress');
		const board_progress = document.getElementById('board_progress');
		const loader = new GLTFLoader();

		return new Promise((res) => {
			// @TODO 読み込みに時間が掛かっている時の処理を書く
			loader.load('model_data/Board_low.gltf', (obj) => {
				this.#objectPool.board = obj;
				loadingQueue.board = true;
				if (Object.values(loadingQueue).every(v => {return v})) res();
			}, (xhr) => {
				// console.log(xhr)
				console.log(`[Model loading: Board] ${xhr.loaded / xhr.total * 100}% loaded` );
				board_progress.value = (xhr.loaded / xhr.total * 100);
			});

			loader.load('model_data/Disk.gltf', (obj) => {
				this.#objectPool.disk = obj;
				loadingQueue.disk = true;

				if (Object.values(loadingQueue).every(v => {return v})) res();
			}, (xhr) => {
				// console.log(xhr)
				console.log(`[Model loading: Disk] ${xhr.loaded / xhr.total * 100}% loaded` );
				disk_progress.value = (xhr.loaded / xhr.total * 100);
			});
		});
	}

	disableLoadingScreen() {
		const cautionScreen = document.getElementById('caution_screen');
		if (screen.orientation.type.includes('landscape')) cautionScreen.style.display = 'none';
		const loadingScreen = document.getElementById('loading_screen');
		loadingScreen.style.display = 'none';
	}

	run() {
		const tick = () => {
			this.#frame += 1;
			if(this.#currentSection) this.#currentSection.run();
			if(this.#cameraManager) this.#cameraManager.update();
			if(this.#rendererManager && this.#scene) this.#rendererManager.render(this.#scene);
			requestAnimationFrame(tick)
		}

		tick();
	}

	init() {
		const url = new URL(window.location.href);
		const params = url.searchParams;

		this.#frame = 0;
		this.#scene = new THREE.Scene();

		this.#rendererManager = new RendererManager(this);
		this.#sectionManager = new SectionManager(this, this.#rendererManager, this.#scene);
		this.#cameraManager = new CameraManager(this, this.#rendererManager, this.#scene);
		this.#currentSection = new TitleSection(this, this.#rendererManager, this.#cameraManager, this.#scene);
		this.#domManager = new DOMManager(this, this.#rendererManager, this.#cameraManager);
		this.#logger = new Logger(document.getElementById('log'));
		if (params.get('logged') === 'true') this.#logger.on();
		this.#logger.enabled = true;
		this.#domManager.addDOMEventListeners();
		this.#sectionManager.changeSection(this.#currentSection);
		this.GAME_STATE = GameManager.BEFORE_START;
		this.#currentTurn = Disk.BLACK;

		this.addIngameListener();
	}

	addIngameListener() {
		this.addEventListener('game_start', async (e) => {
			if (this.GAME_STATE != GameManager.BEFORE_START) return;
			// await this.#domManager.cutin("ゲームスタート", this.#audio.start);

			this.#startTime = e.time;
			this.#board = new Board(8, 8);
			this.#currentSection = new GameSection(this, this.#rendererManager, this.#cameraManager, this.#scene);
			this.#sectionManager.changeSection(this.#currentSection);

			this.#logger.log("[Event]: game_start");
			// console.log("[Event]: game_start");
			this.#enemy = new Enemy(this, Disk.BLACK);
			this.#player = new Player(this, Disk.WHITE);
			this.#player.name = this.#domManager.getPlayerName();
		});

		this.addEventListener('turn_notice', () => {
			this.#logger.log(`@gm > waiting ${this.#currentTurn == Disk.BLACK ? "Enemy" : `${this.#player.name}`}'s response ...`);
			// console.log(`@gm > waiting ${this.#currentTurn == Disk.BLACK ? "Enemy" : `${this.#player.name}`}'s response ...`)
		});

		this.addEventListener('put_notice', (data) => {
			if (this.GAME_STATE != GameManager.IN_GAME) return;

			let order = data.order;
			let x = data.x;
			let y = data.y;

			if (order !== this.#currentTurn) return;

			this.#logger.log("gameManager received: put_notice");
			// console.log("gameManager received: put_notice");

			if (this.checkCanPut(x, y)) {
				let count = this.countReversible(this.#currentTurn, x, y);
				// this.#logger.log(`count: ${count}`);
				// console.log(`count: ${count}`);
				this.put(x, y);
				this.#logger.log("gameManager send: put_success");
				// console.log("gameManager send: put_success");

				this.checkCorner(order, x, y);
				this.dispatchEvent(new Event.PutSuccessEvent(this.#currentTurn, {x, y}, count));
			} else {
				this.#logger.log("gameManager send: put_fail");
				// console.log("gameManager send: put_fail");
				this.dispatchEvent(new Event.PutFailEvent(this.#currentTurn));
			}
		});

		this.addEventListener('bang_notice', (data) => {
			this.#logger.log(`[BANG] x: ${data.x}, y: ${data.y}`);
			// console.log(`[BANG] x: ${data.x}, y: ${data.y}`);
			let pos = this.board.raffle(data.order, data.x, data.y, data.anger);
			// console.log(pos);
			for (let p of pos) this.checkCorner(data.order, p.x, p.y);

			this.dispatchEvent(new Event.BangSuccessEvent({"order": this.#currentTurn, "pos": pos}));
			this.#domManager.modeReset();
		});

		this.addEventListener('bang_succes', (e) => {
			this.#logger.log("gameManager received: bang_success");
			// console.log("gameManager received: bang_success");
		});

		this.addEventListener('confirmed', (e) => {
			this.#logger.log("gameManager received: confirmed");
			// console.log("gameManager received: confirmed");
		});

		this.addEventListener('updated', async () => {
			this.#logger.log("gameManager received: updated");
			// console.log("gameManager received: updated")
			if (this.GAME_STATE == GameManager.BEFORE_START) {
				this.GAME_STATE = GameManager.IN_GAME;
				// await sleep(1000);
				this.dispatchEvent(new Event.TurnNoticeEvent(Disk.BLACK, this.#board, true))
			} else if (this.GAME_STATE == GameManager.IN_GAME) {
				// await sleep(1000);
				this.dispatchEvent(new Event.TurnChangeEvent());
			}
		});

		this.addEventListener('put_pass', (e) => {
			if (e.order !== this.#currentTurn) return;

			this.#logger.log("gameManager received: put_pass");
			// console.log("gameManager received: put_pass");
			this.dispatchEvent(new Event.TurnChangeEvent());
		});

		this.addEventListener('turn_change', () => {
			// this.#player.retching(100)
			this.#logger.log("gameManager received: turn_change");
			// console.log("gameManager received: turn_change");console.log("");
			// this.player.retching(10);

			this.#currentTurn == Disk.BLACK ? this.#currentTurn = Disk.WHITE : this.#currentTurn = Disk.BLACK;
			this.#domManager.orderUpdate();
			this.angerUpdate();

			if (this.checkGameOver()) {
				this.#result = this.getResult();
				this.dispatchEvent(new Event.GameOverEvent(this.#result));
			} else {
				this.#logger.log(`[${this.#currentTurn == Disk.BLACK ? "Enemy's" : `${this.#player.name}'s`} turn]`);
				// console.log(`[${this.#currentTurn == Disk.BLACK ? "Enemy's" : `${this.#player.name}'s`} turn]`);
				this.dispatchEvent(new Event.TurnNoticeEvent(this.#currentTurn, this.#board, this.checkTable(this.#currentTurn)));
			}
		});

		this.addEventListener('game_over', async (e) => {
			if (this.GAME_STATE != GameManager.IN_GAME) return;
			this.GAME_STATE = GameManager.GAME_OVER;
			this.#endTime = e.time;
			this.#player.point += e.result.white * 10;
			// this.#player.point += (e.result.white - e.result.black) * 10;
			this.#player.point += (e.result.result == this.#player.name) ? 1250 : 600;
			this.#player.point = Math.floor(this.#player.point);
			await sleep(1000);
			this.#currentSection = new ResultSection(this, this.#rendererManager, this.#cameraManager, this.#scene, this.#result);
			this.#sectionManager.changeSection(this.#currentSection);
		});

		this.addEventListener('game_restart', (e) => {
			if (this.GAME_STATE != GameManager.GAME_OVER) return;
			this.GAME_PLAY_COUNT++;
			this.restart();
		});
	}

	angerUpdate() {
		this.#domManager.angerUpdate();
	}

	restart() {
		this._listeners = {};
		this.init();
	}

	checkGameOver () {
		if (!this.checkTable(Disk.BLACK) && !this.checkTable(Disk.WHITE)) {
			return true;
		} else {
			return false;
		}
	}

	checkTable (order) {
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
			0: { 0: "LU", 7: "LD"},
			7: { 0: "RU", 7: "RD"}
		}

		try {
			let c = corner[x][y];
			if (c) {
				console.log(`${c} was taken by ${order == Disk.WHITE ? 'white' : 'black'}`);
				this.getPlayerFromOrder(order).point += 250;
				this.dispatchEvent(new Event.TakeCornerEvent(order, c))
			}
		} catch {}
	}

	put (x, y) {
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

	getResult() {
		let black =  this.#board.count(Disk.BLACK);
		let white =  this.#board.count(Disk.WHITE);
		let result = (black < white) ? this.#player.name : this.#enemy.name;
		if (black == white) result = "draw";
		return {black, white, result};
	}

	getPlayerFromOrder(order) {
		if (order == Disk.WHITE) {
			return this.#player;
		} else if (order == Disk.BLACK) {
			return this.#enemy;
		}
	}

	get objects() {return this.#objectPool;}
	get audio() {return this.#audio;}
	get player() {return this.#player;}
	get enemy() {return this.#enemy;}
	get currentTurn() {return this.#currentTurn;}
	get LU() {return this.#LU;}
	get LD() {return this.#LD;}
	get RU() {return this.#RU;}
	get RD() {return this.#RD;}
	get currentSection() {return this.#currentSection;}
	get board() {return this.#board;}
	get startTime() {return this.#startTime;}
	get endTime() {return this.#endTime;}
	get logger() {return this.#logger;}
}