import * as THREE from "three";

import RendererManager from "./renderer_manager.js";
import SectionManager from "./section_manager.js";
import DOMManager from "./dom_manager.js";
import Section from "./section/section.js";
import TitleSection from "./section/TitleSection/title_section.js";
import GameSection from "./section/GameSection/game_section.js";
import ResultSection from "./section/ResultSection/result_section.js";
import Player from "./player.js";
import Enemy from "./enemy.js";
import Minimap from "./minimap.js";
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
	#minimap;

	#board;
	#player;
	#enemy;

	#current_turn;
	#result;

	constructor() {
		super();
		this.init();
	}

	run() {
		const tick = () => {
			this.#frame += 1;
			this.#current_section.run();
			this.#renderer_manager.render(this.#scene);
			requestAnimationFrame(tick)
		}

		tick();
	}

	init() {
		this.#frame = 0;
		this.#renderer_manager = new RendererManager(this);
		this.#section_manager = new SectionManager();
		this.#dom_manager = new DOMManager(this, this.#renderer_manager);
		this.#minimap = new Minimap(this, this.#renderer_manager, this.#dom_manager);

		if (this.GAME_PLAY_COUNT == 0) this.#dom_manager.addDOMEventListener();

		this.#scene = new THREE.Scene();
		this.#section_manager.scene = this.#scene;
		this.#section_manager.renderer_manager = this.#renderer_manager;
		this.#current_section = new TitleSection(this, this.#renderer_manager, this.#scene);
		this.#section_manager.change_section(this.#current_section);
		this.GAME_STATE = GameManager.BEFORE_START;
		this.#current_turn = Disk.BLACK;

		this.addIngameListener();
	}

	addIngameListener() {
		this.addEventListener('game_start', async (e) => {
			if (this.GAME_STATE != GameManager.BEFORE_START) return;
			this.#start_time = e.time;
			this.#current_section = new GameSection(this, this.#renderer_manager, this.#scene);
			this.#section_manager.change_section(this.#current_section);

			console.log("[Event]: game_start");
			this.#board = new Board(8, 8);
			this.#enemy = new Enemy(this, Disk.BLACK);
			this.#player = new Player(this, Disk.WHITE);
			this.#minimap.update(this.#board.table);
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
				this.#minimap.update(this.#board.table);
			} else {
				console.log("game_manager send: put_fail");
				this.dispatchEvent(new Event.PutFailEvent(this.#current_turn));
			}
		});

		this.addEventListener('confirmed', (e) => {
			console.log("game_manager received: confirmed");
			// this.#current_section.mode = GameSection.MODE_NONE;
			this.#minimap.scaleUp();
		});

		this.addEventListener('updated', async () => {
			console.log("game_manager received: updated")
			if (this.GAME_STATE == GameManager.BEFORE_START) {
				this.GAME_STATE = GameManager.IN_GAME;
				await sleep(1000);
				this.dispatchEvent(new Event.TurnNoticeEvent(Disk.BLACK, this.#board, true))
			} else if (this.GAME_STATE == GameManager.IN_GAME) {
				await sleep(1000);
				this.dispatchEvent(new Event.TurnChangeEvent());
			}
		});

		this.addEventListener('put_pass', (e) => {
			if (e.order !== this.#current_turn) return;
			// console.log(e);

			console.log("game_manager received: put_pass");
			this.dispatchEvent(new Event.TurnChangeEvent());
		});

		this.addEventListener('turn_change', () => {
			console.log("game_manager received: turn_change");console.log("");

			this.#current_turn == Disk.BLACK ? this.#current_turn = Disk.WHITE : this.#current_turn = Disk.BLACK;
			this.#dom_manager.order_update();

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
			this.#current_section = new ResultSection(this, this.#renderer_manager, this.#scene, this.#result);
			this.#section_manager.change_section(this.#current_section);
		});

		this.addEventListener('game_restart', (e) => {
			if (this.GAME_STATE != GameManager.GAME_OVER) return;
			this.GAME_PLAY_COUNT++;
			this.restart();
		});
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

	get player() {return this.#player;}
	get enemy() {return this.#enemy;}
	get minimap() {return this.#minimap;}
	get current_turn() {return this.#current_turn;}
	get current_section() {return this.#current_section;}
	get board() {return this.#board;}
	get start_time() {return this.#start_time;}
	get end_time() {return this.#end_time;}
}