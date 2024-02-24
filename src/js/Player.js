import * as THREE from 'three';
import * as Event from "./Event.js";
import { Disk } from "./Object.js"

export default class Player {
	static PATIENCE = 0;
	#gameManager;
	#logger;
	#order;
	#name = 'player';
	#point = 0;
	#anger = 0;

	constructor (gameManager, order) {
		this.#gameManager = gameManager;
		this.#logger = this.#gameManager.logger;
		this.#order = order;

		this.#gameManager.addEventListener('turn_notice', (e) => {
			if (e.order != this.order) return;
			this.#logger.log(this.name + " received: turn_notice");
			// console.log(this.name + " received: turn_notice");

			let diff = this.#gameManager.board.count(this.#gameManager.enemy.order) - this.#gameManager.board.count(this.order);

			if (diff > 5) this.retching(Math.floor(diff / 5) * 1.5);
			if (!e.canPut) this.retching(7.5);
		});

		this.#gameManager.addEventListener('put_success', (e) => {
			if (e.order == this.order) {
				this.#logger.log(this.name + " received: put_success");
				// console.log(this.name + " received: put_success");

				this.#logger.log(`${this.name} send: confirmed`);
				// console.log(`${this.name} send: confirmed`);
				this.#gameManager.dispatchEvent(new Event.ConfirmationEvent());
			} else {
				// console.log(e);
				if (e.count > 4) {
					this.retching(5);
				}
			}
		});

		this.#gameManager.addEventListener('take_corner', (e) => {
			if (e.order == this.order) return;
			this.#logger.log(this.name + " received: take_corner");
			this.retching(20);
		});

		this.#gameManager.addEventListener('bang_success', (e) => {
			if (e.order != this.order) return;
			this.#logger.log(this.name + " received: bang_success");
			// console.log(this.name + " received: bang_success");

			this.#logger.log(`${this.name} send: confirmed`);
			// console.log(`${this.name} send: confirmed`);
			if (e.order != this.order) return;
			this.calmdown();
			this.#gameManager.dispatchEvent(new Event.ConfirmationEvent());
		});

		this.#gameManager.addEventListener('put_fail', (e) => {
			if (e.order != this.order) return;
			this.#logger.log(this.name + " received: put_fail");
			// console.log(this.name + " received: put_fail");
		});

		this.#gameManager.addEventListener('game_over', (e) => {
			this.#logger.log(`${this.name} received: game_over`);
			// console.log(`${this.name} received: game_over`)
			// console.log(e);
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

	get gameManager() {return this.#gameManager;}
	get order() {return this.#order;}
	get name() {return this.#name;}
	set name(name) {this.#name = name;}
	get point() {return this.#point;}
	set point(point) {this.#point = point;}
	get anger() {return this.#anger;}
	set anger(anger) {this.#anger = anger;}
	get logger() {return this.#logger;}
}