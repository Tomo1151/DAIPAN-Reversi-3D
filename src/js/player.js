import { EventManager } from "./event.js";

export default class Player {
	#order;
	#name = 'player';
	#point = 0;

	#event_manager = new EventManager();

	constructor (order) {
		this.#order = order;

		this.addEventListener('turn_notice', () => {
			console.log(this.name + " received: turn_notice");
			// console.log(e)
		});

		this.addEventListener('put_success', (e) => {
			console.log(this.name + " received: put_success");
			// console.log(e);
			console.log(`${this.name} send: confirmed`);
			gm.dispatchEvent(new ConfirmationEvent());
		});

		this.addEventListener('put_fail', (e) => {
			console.log(this.name + " received: put_fail");
			// console.log(e);
		});

		this.addEventListener('game_over', (e) => {
			console.log(`${this.name} received: game_over`)
			console.log(e);
		});
	}

	addEventListener(event_name, callback) {
		this.#event_manager.addEventListener(event_name, callback);
	}

	dispatchEvent(event, dispatch_object) {
		this.#event_manager.dispatchEvent(event, dispatch_object);
	}

	get order() {return this.#order;}
	get name() {return this.#name;}
	set name(name) {this.#name = name;}
}