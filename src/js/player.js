import * as THREE from 'three';
import * as Event from "./Event.js";
import { Disk } from "./Object.js"

export default class Player {
	static PATIENCE = 80;
	#gameManager;
	#order;
	#name = 'player';
	#point = 0;
	#anger = 0;

	constructor (gameManager, order) {
		this.#gameManager = gameManager;
		this.#order = order;

		this.#gameManager.addEventListener('turn_notice', (e) => {
			if (e.order != this.order) return;
			console.log(this.name + " received: turn_notice");
		});

		this.#gameManager.addEventListener('put_success', (e) => {
			if (e.order != this.order) return;
			console.log(this.name + " received: put_success");

			console.log(`${this.name} send: confirmed`);
			if (e.order != this.order) return;
			this.#gameManager.dispatchEvent(new Event.ConfirmationEvent());
		});

		this.#gameManager.addEventListener('bang_success', (e) => {
			if (e.order != this.order) return;
			console.log(this.name + " received: bang_success");

			console.log(`${this.name} send: confirmed`);
			if (e.order != this.order) return;
			this.calmdown();
			this.#gameManager.dispatchEvent(new Event.ConfirmationEvent());
		});

		this.#gameManager.addEventListener('put_fail', (e) => {
			if (e.order != this.order) return;
			console.log(this.name + " received: put_fail");
		});

		this.#gameManager.addEventListener('game_over', (e) => {
			console.log(`${this.name} received: game_over`)
			console.log(e);
		});
	}

	retching(d) {
		this.#anger += d;
		this.#anger = Math.min(this.#anger, 100);
		this.#gameManager.angerUpdate();
	}

	calmdown(d) {
		if (d) {
			this.#anger -= d;
			this.#anger = Math.max(this.#anger, 0);
		} else {
			this.#anger = 0;
		}
		this.#gameManager.angerUpdate();
	}

	// addEventListener(event_name, callback) {
	// 	this.#event_dispatcher.addEventListener(event_name, callback);
	// }

	// dispatchEvent(event, dispatch_object) {
	// 	this.#event_dispatcher.dispatchEvent(event);
	// }

	get gameManager() {return this.#gameManager;}
	get order() {return this.#order;}
	get name() {return this.#name;}
	set name(name) {this.#name = name;}
	get point() {return this.#point;}
	set point(point) {this.#point = point;}
	get anger() {return this.#anger;}
	set anger(anger) {this.#anger = anger;}
}