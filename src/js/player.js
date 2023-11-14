import * as THREE from 'three';
import { EventManager } from "./event.js";

export default class Player {
	#game_manager;
	#order;
	#name = 'player';
	#point = 0;

	constructor (game_manager, order) {
		this.#order = order;
		this.#game_manager = game_manager;

		// this.addEventListener('turn_notice', () => {
		// 	console.log(this.name + " received: turn_notice");
		// 	// console.log(e)
		// });

		// this.addEventListener('put_success', (e) => {
		// 	console.log(this.name + " received: put_success");
		// 	// console.log(e);
		// 	console.log(`${this.name} send: confirmed`);
		// 	gm.dispatchEvent(new ConfirmationEvent());
		// });

		// this.addEventListener('put_fail', (e) => {
		// 	console.log(this.name + " received: put_fail");
		// 	// console.log(e);
		// });

		// this.addEventListener('game_over', (e) => {
		// 	console.log(`${this.name} received: game_over`)
		// 	console.log(e);
		// });
	}

	// addEventListener(event_name, callback) {
	// 	this.#event_dispatcher.addEventListener(event_name, callback);
	// }

	// dispatchEvent(event, dispatch_object) {
	// 	this.#event_dispatcher.dispatchEvent(event);
	// }

	get game_manager() {return this.#game_manager;}
	get order() {return this.#order;}
	get name() {return this.#name;}
	set name(name) {this.#name = name;}
}