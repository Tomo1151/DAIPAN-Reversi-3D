import * as Event from "./event.js"
import { Disk } from "./object.js";
import { sleep } from "./utils.js";
import GameManager from "./game_manager.js";
import GameSection from "./section/GameSection/game_section.js";

export default class DOMManager {
	#game_manager;

	#title_screen_dom;
	#start_button;

	#order_dom;
	#ingame_buttons;
	#put_button;
	#pass_button;
	#bang_button;

	#result_screen_dom;
	#restart_button;

	constructor(game_manager) {
		this.#game_manager = game_manager;

		this.#title_screen_dom = document.getElementById('title_screen');
		this.#start_button = document.getElementById('start_button');
		this.#order_dom = document.getElementById('order_div');
		this.#ingame_buttons = document.getElementById('action_button');
		this.#put_button = this.#ingame_buttons.children[0];
		this.#pass_button = this.#ingame_buttons.children[1];
		this.#bang_button = this.#ingame_buttons.children[2];
		this.#result_screen_dom = document.getElementById('result_screen');
		this.#restart_button = document.getElementById('restart_button');
		// this.#title_screen_dom = document.getElementById();

		this.#game_manager.addEventListener('game_over', async (e) => {
			console.log(e)
			await sleep(1500);
			this.#put_button.classList.remove('active');
			this.#put_button.classList.add('disabled');
			this.#bang_button.classList.remove('active');
			this.#bang_button.classList.add('disabled');
			this.draw_result_screen(e.result);
		});

		this.#game_manager.addEventListener('game_restart', () => {
			console.log('GAME RESTART');
			this.hide(this.#order_dom);
			this.hide(this.#ingame_buttons);
			this.hide(this.#result_screen_dom);
			this.show(this.#title_screen_dom);
		});
	}

	addDOMEventListener() {
		// def Game Events
		document.getElementById('start_button').addEventListener('click', () => {
			// Setting DOMs
			console.log("* send: game_start");console.log("");
			this.order_update();
			this.hide(this.#title_screen_dom);
			this.show(this.#ingame_buttons);
			this.show(this.#order_dom, true);

			this.#game_manager.dispatchEvent(new Event.GameStartEvent());
		});

		/*
		 * GameSection
		 */
		this.#put_button.addEventListener('click', () => {
			if (this.#game_manager.current_turn != this.#game_manager.player.order) return;
			this.#bang_button.classList.remove('active');
			this.#put_button.classList.add('active');
			this.#game_manager.current_section.mode = GameSection.MODE_PUT;
		});
		this.#pass_button.addEventListener('click', () => {
			if (this.#game_manager.current_turn != this.#game_manager.player.order || this.#game_manager.checkTable(this.#game_manager.player.order)) return;
			this.#game_manager.dispatchEvent(new Event.PutPassEvent(this.#game_manager.player.order));
			document.getElementById('pass_button').classList.add('disabled');
		});
		this.#bang_button.addEventListener('click', () => {
			if (this.#game_manager.current_turn != this.#game_manager.player.order) return;
			this.#game_manager.current_section.mode = GameSection.MODE_PUT;
			this.#put_button.classList.remove('active');
			this.#bang_button.classList.add('active');
			// this.#current_section.mode = GameSection.MODE_BANG;
		});

		/*
		 * ResultSection
		 */
		this.#restart_button.addEventListener('click', (e) => {
			// console.log(e);
			this.#game_manager.dispatchEvent(new Event.GameRestartEvent());
		});
	}

	draw_result_screen(result) {
		let dom_result_score = document.getElementById('score');
		let dom_result_black = document.getElementById('order_black');
		let dom_result_white = document.getElementById('order_white');

		this.hide(this.#order_dom);
		this.hide(this.#ingame_buttons);
		this.show(this.#result_screen_dom);

		console.log(result);

		dom_result_white.innerText = result.white;
		dom_result_black.innerText = result.black;
		dom_result_score.innerText = -1;
	}

	show(dom, is_flex = false) {
		if (is_flex) {
			dom.style.display = "flex";
		} else {
			dom.style.display = "block";
		}
	}

	order_update(){
		let p = document.getElementById('order');
		// console.log(p)
		if (this.#game_manager.current_turn == Disk.BLACK) {
			p.children[0].innerText = '黒';
			p.classList.remove('order-white');
			p.classList.add('order-black');
		} else {
			p.children[0].innerText = '白';
			p.classList.remove('order-black');
			p.classList.add('order-white');
		}
	}

	hide(dom) {
		dom.style.display = "none";
	}


}