import * as THREE from 'three';
import * as Event from "./event.js";
import { Disk } from "./object.js"
export default class Player {
	#game_manager;
	#order;
	#name = 'player';
	#point = 0;
	#anger = 0;

	constructor (game_manager, order) {
		this.#game_manager = game_manager;
		this.#order = order;

		this.#game_manager.addEventListener('turn_notice', (e) => {
			if (e.order != this.order) return;
			console.log(this.name + " received: turn_notice");
		});

		this.#game_manager.addEventListener('put_success', (e) => {
			if (e.order != this.order) return;
			console.log(this.name + " received: put_success");

			console.log(`${this.name} send: confirmed`);
			if (e.order != this.order) return;
			this.#game_manager.dispatchEvent(new Event.ConfirmationEvent());
		});

		this.#game_manager.addEventListener('put_fail', (e) => {
			if (e.order != this.order) return;
			console.log(this.name + " received: put_fail");
		});

		this.#game_manager.addEventListener('game_over', (e) => {
			console.log(`${this.name} received: game_over`)
			console.log(e);
		});
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
	get point() {return this.#point;}
	set point(point) {this.#point = point;}
	get anger() {return this.#anger;}
	set anger(anger) {this.#anger = anger;}
}