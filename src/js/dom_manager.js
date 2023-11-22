import * as Event from "./event.js"
import { Disk } from "./object.js";
import GameManager from "./game_manager.js";
import GameSection from "./section/GameSection/game_section.js";

export default class DOMManager {
	#game_manager;

	#title_screen_dom;
	#start_button;

	#order_dom;
	#ingame_buttons;

	#result_screen_dom;
	#restart_button;

	constructor(game_manager) {
		this.#game_manager = game_manager;

		this.#title_screen_dom = document.getElementById('title_screen');
		this.#start_button = document.getElementById('start_button');
		this.#order_dom = document.getElementById('order_div');
		this.#ingame_buttons = document.getElementById('action_button');
		this.#result_screen_dom = document.getElementById('result_screen');
		this.#restart_button = document.getElementById('restart_button');
		// this.#title_screen_dom = document.getElementById();

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
			this.hide(this.#title_screen_dom);
			this.show(this.#ingame_buttons);
			this.show(this.#order_dom, true);

			this.#game_manager.dispatchEvent(new Event.GameStartEvent());
		});

		/*
		 * GameSection
		 */
		this.#ingame_buttons.children[0].addEventListener('click', () => {
			if (this.#game_manager.current_turn != this.#game_manager.player.order) return;
			this.#game_manager.current_section.mode = GameSection.MODE_PUT;
			console.log(this.#game_manager.current_section.mode);
		});
		this.#ingame_buttons.children[1].addEventListener('click', () => {
			if (this.#game_manager.current_turn != this.#game_manager.player.order || this.#game_manager.checkTable(this.#game_manager.player.order)) return;
			this.#game_manager.dispatchEvent(new Event.PutPassEvent(this.#game_manager.player.order));
			document.getElementById('pass_button').classList.add('disabled');
		});
		this.#ingame_buttons.children[2].addEventListener('click', () => {
			if (this.#game_manager.current_turn != this.#game_manager.player.order) return;
			this.#game_manager.current_section.mode = GameSection.MODE_PUT;
			// this.#current_section.mode = GameSection.MODE_BANG;
		});

		/*
		 * ResultSection
		 */
		this.#restart_button.addEventListener('click', (e) => {
			console.log(e);
			this.#game_manager.dispatchEvent(new Event.GameRestartEvent());
		});
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
		console.log(p)
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