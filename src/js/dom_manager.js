import * as Event from "./event.js"
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
		// this.#title_screen_dom = document.getElementById();
		// this.#title_screen_dom = document.getElementById();

		// def Game Events
		document.getElementById('start_button').addEventListener('click', () => {
			// Setting DOMs
			console.log("* send: game_start");console.log("");
			let div = document.getElementById('title_screen');
			div.style.display = 'none';
			let action_buttons = document.getElementById('action_button');
			action_buttons.style.display = 'block';

			action_buttons.children[0].addEventListener('click', () => {
				if (this.#game_manager.current_turn != this.#game_manager.player.order) return;
				this.#game_manager.current_section.mode = GameSection.MODE_PUT;
				console.log(this.#game_manager.current_section.mode)
			});
			action_buttons.children[1].addEventListener('click', () => {
				if (this.#game_manager.current_turn != this.#game_manager.player.order || this.#game_manager.checkTable(this.#game_manager.player.order)) return;
				this.#game_manager.dispatchEvent(new Event.PutPassEvent(this.#game_manager.player.order));
				document.getElementById('pass_button').classList.add('disabled');
			});
			action_buttons.children[2].addEventListener('click', () => {
				if (this.#game_manager.current_turn != this.#game_manager.player.order) return;
				this.#game_manager.current_section.mode = GameSection.MODE_PUT;
				// this.#current_section.mode = GameSection.MODE_BANG;
			});

			this.#game_manager.dispatchEvent(new Event.GameStartEvent());
		});
	}


}