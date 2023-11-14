import * as THREE from "three";

import RendererManager from "./renderer_manager.js";
import SectionManager from "./section_manager.js";
import Section from "./section/section.js";
import TitleSection from "./section/TitleSection/title_section.js";
import GameSection from "./section/GameSection/game_section.js";
import Enemy from "./enemy.js";

export default class GameManager extends THREE.EventDispatcher {
	static BEFORE_START = 0;
	static IN_GAME = 1;
	static GAME_OVER = 2;
	static GAME_STATE = this.BEFORE_START;

	#frame;
	#time;
	#scene;
	#current_section;

	#renderer_manager;
	#section_manager;

	constructor() {
		super();
		this.addEventListener('test', (e) => {
			console.log(e)
			console.log(this)
			this.dispatchEvent({'type': 'test2', 'data': {'x': 1, 'y': 2}})
		})
		this.#frame = 0;
		this.#time = 0;

		this.#renderer_manager = new RendererManager(this);
		this.#section_manager = new SectionManager();

		this.#scene = new THREE.Scene();
		this.#section_manager.scene = this.#scene;
		this.#section_manager.renderer_manager = this.#renderer_manager;
		this.#current_section = new GameSection(this, this.#renderer_manager, this.#scene);
		this.#section_manager.change_section(this.#current_section);
	}

	run() {
		const tick = () => {
			this.#frame += 1;

			if (this.#frame % 10 == 0) {this.#current_section.run();}
			this.#renderer_manager.render(this.#scene);

			requestAnimationFrame(tick)
		}

		tick();
	}

	game_init() {
	}

	// #board = new Board(8, 8);
	// #players = new Array(2);
	// #current_turn = Disk.BLACK;
	// #dest_i;
	// #dest_o;
	// #event_manager = new EventManager();

	// constructor (players) {
	// 	this.#players[0] = players[0];
	// 	this.#players[1] = players[1];

	// 	this.addEventListener('game_start', () => {
	// 		// 初回
	// 		console.log("[event] : gamestart");
	// 		this.GAME_STATE = GameManager.IN_GAME;
	// 		this.setDests();
	// 		this.object_update();

	// 		// 初回はDisk.BLACK に turn_notice
	// 		this.dest_i.dispatchEvent(new TurnNoticeEvent(this.board, true));
	// 	});

	// 	// 石を置かれた時
	// 	this.addEventListener('put_notice', (data) => {
	// 		if (this.GAME_STATE != GameManager.IN_GAME) return;

	// 		// 置かれた情報
	// 		let order = data["order"];
	// 		let result_event;
	// 		let x = data["x"];
	// 		let y = data["y"];

	// 		// 手番じゃないプレイヤーからのイベントは無視
	// 		if (order !== this.current_turn) return;

	// 		console.log("[gm] received: put_notice");

	// 		if (this.checkCanPut(x, y)) {
	// 			this.put(x, y);

	// 			// self と dest_i へ置けた報告
	// 			this.dispatchEvent(new PutSuccessEvent());
	// 			this.dest_i.dispatchEvent(new PutSuccessEvent());
	// 			this.object_update();
	// 		} else {
	// 			this.dest_i.dispatchEvent(new PutFailEvent());
	// 		}
	// 	});

	// 	// player が put_success を受け取ったら
	// 	this.addEventListener('confirmed', () => {
	// 		console.log("[gm] received: confirmed");
	// 		this.dispatchEvent(new TurnChangeEvent());
	// 	});

	// 	// ターンチェンジの指示があったら
	// 	this.addEventListener('turn_change', () => {
	// 		console.log("[gm] received: turn_change");
	// 		console.log("");
	// 		console.log(`[${this.current_turn == 0 ? "Enemy's" : "Player's"} turn]`);

	// 		// 情報書き換え
	// 		this.changeTurn();

	// 		if (this.checkGameOver()) {
	// 			this.boroadcastGameEvent(new GameOverEvent());
	// 		} else {
	// 			// 新たな手番へターンを報告
	// 			this.dest_i.dispatchEvent(new TurnNoticeEvent(this.board, this.checkTable(this.current_turn)));

	// 			if (this.current_turn == Disk.WHITE && !this.checkTable(this.current_turn)) {
	// 				this.pass();
	// 			}
	// 		}

	// 	});

	// 	// 石をおけた時
	// 	this.addEventListener('put_success', (e) => {
	// 		console.log("[gm] received: put_success");
	// 	});

	// 	// プレイヤーからパスの指示を受けたら
	// 	this.addEventListener('put_pass', () => {
	// 		console.log("[gm] received: put_pass");
	// 		this.dispatchEvent(new TurnChangeEvent());
	// 	})
	// }

	// addEventListener(event_name, callback) {
	// 	this.#event_manager.addEventListener(event_name, callback);
	// }

	// dispatchEvent (event, dispatch_object) {
	// 	this.#event_manager.dispatchEvent(event, dispatch_object);
	// }

	// findEventDest (order) {
	// 	return this.players.find(p => p.order == order);
	// }

	// findEnemy () {
	// 	return this.players.find(p => p.name == 'enemy');
	// }

	// checkGameOver () {
	// 	if (!this.checkTable(Disk.BLACK) && !this.checkTable(Disk.WHITE)) {
	// 		this.GAME_STATE = GameManager.GAME_OVER;
	// 		return true;
	// 	} else {
	// 		return false;
	// 	}
	// }

	// boroadcastGameEvent (event) {
	// 	for (let player of this.players) {
	// 		player.dispatchEvent(event);
	// 	}
	// }

	// checkTable (order) {
	// 	for (let i = 0; i < this.board.height; i++) {
	// 		for (let j = 0; j < this.board.width; j++) {
	// 			if (this.board.putJudgement(order, j, i)) {
	// 				return true;
	// 			}
	// 		}
	// 	}
	// 	return false;
	// }

	// checkCanPut(x, y) {
	// 	return this.#board.putJudgement(this.current_turn, x, y);
	// }

	// put (x, y) {
	// 	this.board.putDisk(this.current_turn, x, y);
	// 	// this.board.view();
	// }

	// object_update() {
	// 	show_models(this.board);
	// }

	// setDests () {
	// 	this.dest_i = this.findEventDest(this.current_turn);
	// 	this.dest_o = this.findEventDest(board.getOpponent(this.current_turn));
	// }

	// get dest_i () {return this.#dest_i;}
	// get dest_o () {return this.#dest_o;}
	// get board () {return this.#board;}
	// get players () {return this.#players;}
	// get current_turn () {return this.#current_turn;}

	// set dest_i (dest_i) {this.#dest_i = dest_i;}
	// set dest_o (dest_o) {this.#dest_o = dest_o;}

	// pass () {
	// 	let button = document.getElementById('pass_button');
	// 	button.style.display = 'block';
	// 	button.addEventListener('click', () => {
	// 		this.dispatchEvent(new PutPassEvent());
	// 		button.style.display = 'none';
	// 	});
	// }

	// changeTurn () {
	// 	this.current_turn == Disk.BLACK ? this.#current_turn = Disk.WHITE : this.#current_turn = Disk.BLACK;

	// 	this.setDests();

	// 	let div = document.getElementById('order_div');
	// 	if (this.current_turn == Disk.BLACK) {
	// 		div.children[0].innerText = 'BLACK';
	// 		div.classList.remove('order-white');
	// 		div.classList.add('order-black');
	// 	} else {
	// 		div.children[0].innerText = 'WHITE';
	// 		div.classList.remove('order-black');
	// 		div.classList.add('order-white');
	// 	}
	// }
}