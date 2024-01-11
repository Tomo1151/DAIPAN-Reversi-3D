import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import RendererManager from "./renderer_manager.js";
import SectionManager from "./section_manager.js";
import DOMManager from "./dom_manager.js";
import CameraManager from "./camera_manager.js";
import Section from "./section/section.js";
import TitleSection from "./section/TitleSection/title_section.js";
import GameSection from "./section/GameSection/game_section.js";
import ResultSection from "./section/ResultSection/result_section.js";
import Player from "./player.js";
import Enemy from "./enemy.js";
import * as Event from "./event.js";
import { Disk, Board } from "./object.js";
import { sleep } from "./utils.js";

export default class GameManager extends THREE.EventDispatcher {
	static BEFORE_START = 0;
	static IN_GAME = 1;
	static GAME_OVER = 2;

	GAME_STATE;
	GAME_PLAY_COUNT = 0;

	#frame;
	#start_time;

	#end_time;
	#scene;
	#current_section;

	#renderer_manager;
	#section_manager;
	#dom_manager;
	#camera_manager;

	#board;
	#player;
	#enemy;

	#current_turn;
	#result;

	#object_pool = {
		"board": undefined,
		"disk": undefined
	}

	constructor() {
		super();
		this.model_load().then(() => {
			this.init();
			this.disable_loading_screen();
		});
	}

	model_load() {
		let loading_queue = {"board": false, "disk": false}
		const loader = new GLTFLoader();

		return new Promise((res) => {
			loader.load('https://reversi.syntck.com/model_data/Board_low.gltf', (obj) => {
				this.#object_pool.board = obj;
				loading_queue.board = true;
				if (Object.values(loading_queue).every(v => {return v})) res();
			}, (xhr) => {
				// console.log(xhr)
				console.log(`[Model loading: Board] ${xhr.loaded / xhr.total * 100}% loaded` );
			});

			loader.load('https://reversi.syntck.com/model_data/Disk.gltf', (obj) => {
				this.#object_pool.disk = obj;
				loading_queue.disk = true;

				if (Object.values(loading_queue).every(v => {return v})) res();
			}, (xhr) => {
				// console.log(xhr)
				console.log(`[Model loading: Disk] ${xhr.loaded / xhr.total * 100}% loaded` );
			});
		});
	}

	disable_loading_screen() {
		const loading_screen = document.getElementById('loading');
		loading_screen.style.display = 'none';
	}

	run() {
		const tick = () => {
			this.#frame += 1;
			if(this.#current_section) this.#current_section.run();
			if(this.#camera_manager) this.#camera_manager.update();
			if(this.#renderer_manager && this.#scene) this.#renderer_manager.render(this.#scene);
			requestAnimationFrame(tick)
		}

		tick();
	}

	init() {
		this.#frame = 0;
		this.#scene = new THREE.Scene();

		this.#renderer_manager = new RendererManager(this);
		this.#section_manager = new SectionManager(this, this.#renderer_manager, this.#scene);
		this.#camera_manager = new CameraManager(this, this.#renderer_manager, this.#scene);
		this.#current_section = new TitleSection(this, this.#renderer_manager, this.#camera_manager, this.#scene);
		this.#dom_manager = new DOMManager(this, this.#renderer_manager, this.#camera_manager);
		this.#dom_manager.addDOMEventListeners();
		this.#section_manager.change_section(this.#current_section);
		this.GAME_STATE = GameManager.BEFORE_START;
		this.#current_turn = Disk.BLACK;

		this.addIngameListener();
	}

	addIngameListener() {
		this.addEventListener('game_start', async (e) => {
			if (this.GAME_STATE != GameManager.BEFORE_START) return;
			this.#start_time = e.time;
			this.#current_section = new GameSection(this, this.#renderer_manager, this.#camera_manager, this.#scene);
			this.#section_manager.change_section(this.#current_section);

			console.log("[Event]: game_start");

			this.#board = new Board(8, 8);
			this.#enemy = new Enemy(this, Disk.BLACK);
			this.#player = new Player(this, Disk.WHITE);
			this.#player.name = this.#dom_manager.get_player_name();

		});

		this.addEventListener('turn_notice', () => {
			console.log(`@gm > waiting ${this.#current_turn == Disk.BLACK ? "Enemy" : `${this.#player.name}`}'s response ...`)
		});

		this.addEventListener('put_notice', (data) => {
			if (this.GAME_STATE != GameManager.IN_GAME) return;

			let order = data["order"];
			let result_event;
			let x = data["x"];
			let y = data["y"];

			if (order !== this.#current_turn) return;

			console.log("game_manager received: put_notice");

			if (this.checkCanPut(x, y)) {
				this.put(x, y);
				console.log("game_manager send: put_success");
				this.dispatchEvent(new Event.PutSuccessEvent(this.#current_turn));
			} else {
				console.log("game_manager send: put_fail");
				this.dispatchEvent(new Event.PutFailEvent(this.#current_turn));
			}
		});

		this.addEventListener('bang_notice', (data) => {
			console.log(`[BANG] x: ${data.x}, y: ${data.y}`);
			let pos = this.board.raffle(data.order, data.x, data.y, data.anger);
			this.dispatchEvent(new Event.BangSuccessEvent({"order": this.#current_turn, "pos": pos}));
			this.#dom_manager.mode_reset();
		});

		this.addEventListener('bang_succes', (e) => {
			console.log("game_manager received: bang_success");
		});

		this.addEventListener('confirmed', (e) => {
			console.log("game_manager received: confirmed");
		});

		this.addEventListener('updated', async () => {
			console.log("game_manager received: updated")
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
			if (e.order !== this.#current_turn) return;

			console.log("game_manager received: put_pass");
			this.dispatchEvent(new Event.TurnChangeEvent());
		});

		this.addEventListener('turn_change', () => {
			console.log("game_manager received: turn_change");console.log("");
			this.player.retching(10);

			this.#current_turn == Disk.BLACK ? this.#current_turn = Disk.WHITE : this.#current_turn = Disk.BLACK;
			this.#dom_manager.order_update();
			this.anger_update();

			if (this.checkGameOver()) {
				const res = this.get_result();
				this.#result = res;
				this.dispatchEvent(new Event.GameOverEvent(res));
			} else {
				console.log(`[${this.#current_turn == Disk.BLACK ? "Enemy's" : `${this.#player.name}'s`} turn]`);
				this.dispatchEvent(new Event.TurnNoticeEvent(this.#current_turn, this.#board, this.checkTable(this.#current_turn)));
			}
		});

		this.addEventListener('game_over', async (e) => {
			if (this.GAME_STATE != GameManager.IN_GAME) return;
			this.GAME_STATE = GameManager.GAME_OVER;
			this.#end_time = e.time;
			this.#player.point += (e.result.white - e.result.black) * 10;
			this.#player.point += (e.result.result == 'white') ? 1250 : 600;
			this.#player.point = Math.floor(this.#player.point);
			await sleep(1000);
			this.#current_section = new ResultSection(this, this.#renderer_manager, this.#camera_manager, this.#scene, this.#result);
			this.#section_manager.change_section(this.#current_section);
		});

		this.addEventListener('game_restart', (e) => {
			if (this.GAME_STATE != GameManager.GAME_OVER) return;
			this.GAME_PLAY_COUNT++;
			this.restart();
		});
	}

	anger_update() {
		this.#dom_manager.anger_update();
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
		return this.#board.putJudgement(this.#current_turn, x, y);
	}

	put (x, y) {
		this.#board.putDisk(this.#current_turn, x, y);
	}

	get_result() {
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

	get objects() {return this.#object_pool;}
	get player() {return this.#player;}
	get enemy() {return this.#enemy;}
	get current_turn() {return this.#current_turn;}
	get current_section() {return this.#current_section;}
	get board() {return this.#board;}
	get start_time() {return this.#start_time;}
	get end_time() {return this.#end_time;}
}