import * as THREE from 'three';
import { sleep } from "./Utils.js"
import Player from "./Player.js";
import { Disk } from "./Object.js";
import * as Event from "./Event.js";

export default class Enemy extends Player {
	#worker = new Worker('./js/Search.js', { type: 'module' });
	#count;

	constructor (gameManager, order) {
		super(gameManager, order);
		this.name = 'COM';
		this.#count = 0;

		this.#worker.addEventListener('message', (e) => {
			console.log(e)
			if (e.data.type == 'search') {
				this.logger.log(`enemy send: put_notice`);
				this.gameManager.dispatchEvent(new Event.PutNoticeEvent(e.data.pos));
			}
		});

		this.gameManager.addEventListener('turn_notice', async (e) => {
			if (e.order != this.order) return;
			let board = e.board;
			this.#count++;

			if (e.canPut) {
				this.#worker.postMessage({type: "search", table: board});
			} else {
				this.gameManager.dispatchEvent(new Event.PutPassEvent(this.order));
			}
		});

		this.gameManager.addEventListener('take_corner', (e) => {
			// if (e.order != this.order) return;
			this.#worker.postMessage({type: "corner", order: e.order, corner: e.corner});
			console.log(e);
		});
	}

	init() {
	}
}