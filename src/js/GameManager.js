import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import RendererManager from "./RendererManager.js";
import SectionManager from "./SectionManager.js";
import DOMManager from "./DOMManager.js";
import CameraManager from "./CameraManager.js";
import Section from "./section/Section.js";
import TitleSection from "./section/TitleSection/TitleSection.js";
import GameSection from "./section/GameSection/GameSection.js";
import ResultSection from "./section/ResultSection/ResultSection.js";
import Player from "./Player.js";
import Enemy from "./Enemy.js";
import * as Event from "./Event.js";
import { Disk, Board } from "./Object.js";
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

	#board;
	#player;
	#enemy;

	#currentTurn;
	#result;

	#objectPool = {
		"board": undefined,
		"disk": undefined
	}

	constructor() {
		super();
		this.modelLoad().then(() => {
			this.init();
			this.disableLoadingScreen();
		});
	}

	modelLoad() {
		let loadingQueue = {"board": false, "disk": false}
		const loader = new GLTFLoader();

		return new Promise((res) => {
			// @TODO 読み込みに時間が掛かっている時の処理を書く
			loader.load('https://reversi.syntck.com/model_data/Board_low.gltf', (obj) => {
				this.#objectPool.board = obj;
				loadingQueue.board = true;
				if (Object.values(loadingQueue).every(v => {return v})) res();
			}, (xhr) => {
				// console.log(xhr)
				console.log(`[Model loading: Board] ${xhr.loaded / xhr.total * 100}% loaded` );
			});

			loader.load('https://reversi.syntck.com/model_data/Disk.gltf', (obj) => {
				this.#objectPool.disk = obj;
				loadingQueue.disk = true;

				if (Object.values(loadingQueue).every(v => {return v})) res();
			}, (xhr) => {
				// console.log(xhr)
				console.log(`[Model loading: Disk] ${xhr.loaded / xhr.total * 100}% loaded` );
			});
		});
	}

	disableLoadingScreen() {
		const loadingScreen = document.getElementById('loading');
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
		this.#frame = 0;
		this.#scene = new THREE.Scene();

		this.#rendererManager = new RendererManager(this);
		this.#sectionManager = new SectionManager(this, this.#rendererManager, this.#scene);
		this.#cameraManager = new CameraManager(this, this.#rendererManager, this.#scene);
		this.#currentSection = new TitleSection(this, this.#rendererManager, this.#cameraManager, this.#scene);
		this.#domManager = new DOMManager(this, this.#rendererManager, this.#cameraManager);
		this.#domManager.addDOMEventListeners();
		this.#sectionManager.changeSection(this.#currentSection);
		this.GAME_STATE = GameManager.BEFORE_START;
		this.#currentTurn = Disk.BLACK;

		this.addIngameListener();
	}

	addIngameListener() {
		this.addEventListener('game_start', async (e) => {
			if (this.GAME_STATE != GameManager.BEFORE_START) return;
			this.#startTime = e.time;
			this.#currentSection = new GameSection(this, this.#rendererManager, this.#cameraManager, this.#scene);
			this.#sectionManager.changeSection(this.#currentSection);

			console.log("[Event]: game_start");

			this.#board = new Board(8, 8);
			this.#enemy = new Enemy(this, Disk.BLACK);
			this.#player = new Player(this, Disk.WHITE);
			this.#player.name = this.#domManager.getPlayerName();

		});

		this.addEventListener('turn_notice', () => {
			console.log(`@gm > waiting ${this.#currentTurn == Disk.BLACK ? "Enemy" : `${this.#player.name}`}'s response ...`)
		});

		this.addEventListener('put_notice', (data) => {
			if (this.GAME_STATE != GameManager.IN_GAME) return;

			let order = data.order;
			let resultEvent;
			let x = data.x;
			let y = data.y;

			if (order !== this.#currentTurn) return;

			console.log("gameManager received: put_notice");

			if (this.checkCanPut(x, y)) {
				this.put(x, y);
				console.log("gameManager send: put_success");
				this.dispatchEvent(new Event.PutSuccessEvent(this.#currentTurn));
			} else {
				console.log("gameManager send: put_fail");
				this.dispatchEvent(new Event.PutFailEvent(this.#currentTurn));
			}
		});

		this.addEventListener('bang_notice', (data) => {
			console.log(`[BANG] x: ${data.x}, y: ${data.y}`);
			let pos = this.board.raffle(data.order, data.x, data.y, data.anger);
			this.dispatchEvent(new Event.BangSuccessEvent({"order": this.#currentTurn, "pos": pos}));
			this.#domManager.modeReset();
		});

		this.addEventListener('bang_succes', (e) => {
			console.log("gameManager received: bang_success");
		});

		this.addEventListener('confirmed', (e) => {
			console.log("gameManager received: confirmed");
		});

		this.addEventListener('updated', async () => {
			console.log("gameManager received: updated")
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

			console.log("gameManager received: put_pass");
			this.dispatchEvent(new Event.TurnChangeEvent());
		});

		this.addEventListener('turn_change', () => {
			console.log("gameManager received: turn_change");console.log("");
			this.player.retching(10);

			this.#currentTurn == Disk.BLACK ? this.#currentTurn = Disk.WHITE : this.#currentTurn = Disk.BLACK;
			this.#domManager.orderUpdate();
			this.angerUpdate();

			if (this.checkGameOver()) {
				const res = this.getResult();
				this.#result = res;
				this.dispatchEvent(new Event.GameOverEvent(res));
			} else {
				console.log(`[${this.#currentTurn == Disk.BLACK ? "Enemy's" : `${this.#player.name}'s`} turn]`);
				this.dispatchEvent(new Event.TurnNoticeEvent(this.#currentTurn, this.#board, this.checkTable(this.#currentTurn)));
			}
		});

		this.addEventListener('game_over', async (e) => {
			if (this.GAME_STATE != GameManager.IN_GAME) return;
			this.GAME_STATE = GameManager.GAME_OVER;
			this.#endTime = e.time;
			this.#player.point += (e.result.white - e.result.black) * 10;
			this.#player.point += (e.result.result == 'white') ? 1250 : 600;
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

	put (x, y) {
		this.#board.putDisk(this.#currentTurn, x, y);
	}

	getResult() {
		let black =  this.#board.count(Disk.BLACK);
		let white =  this.#board.count(Disk.WHITE);
		let res;
		if (black == white) {
			res = "draw";
		} else if (black < white) {
			res = this.#player.name;
		} else {
			res = this.#enemy.name;
		}
		return {
			"black": black,
			"white": white,
			"result": res
		}
	}

	get objects() {return this.#objectPool;}
	get player() {return this.#player;}
	get enemy() {return this.#enemy;}
	get currentTurn() {return this.#currentTurn;}
	get currentSection() {return this.#currentSection;}
	get board() {return this.#board;}
	get startTime() {return this.#startTime;}
	get endTime() {return this.#endTime;}
}