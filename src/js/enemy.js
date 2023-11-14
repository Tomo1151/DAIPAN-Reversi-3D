import * as THREE from 'three';
import Player from "./player.js";

export default class Enemy extends Player {

	constructor (game_manager, order) {
		super(game_manager, order);
		this.name = 'enemy';

		// console.log(this.game_manager)
		// this.game_manager.addEventListener('test', (e) => {console.log(e)})

		// this.addEventListener('turn_notice', async (e) => {
		// 	// console.log(e);
		// 	let board = e.board;
		// 	let event;

		// 	if (e.can_put) {
		// 		const data = this.searchFirst(board);
		// 		event = new PutNoticeEvent(data);
		// 	} else {
		// 		event = new PutPassEvent();
		// 	}

		// 	await sleep(1000);
		// 	console.log(`enemy send: ${event.name}`);
		// 	gm.dispatchEvent(event);
		// });
	}

	checkCanPut (board) {
		const dr = [-1, -1, -1, 0, 0, 1, 1, 1];
		const dc = [-1, 0, 1, -1, 1, -1, 0, 1];
		for (let i = 0; i < board.height; i++) {
			// console.log("b")
			for (let j = 0; j < board.height; j++) {
				if (board.putJudgement(this.order, j, i)) {
					console.log(`x: ${j}, y: ${i}`)
					return true;
				}
			}
		}
		return false;
	}

	searchFirst (board) {
		const dr = [-1, -1, -1, 0, 0, 1, 1, 1];
		const dc = [-1, 0, 1, -1, 1, -1, 0, 1];
		for (let i = 0; i < board.height; i++) {
			// console.log("b")
			for (let j = 0; j < board.height; j++) {
				if (board.putJudgement(this.order, j, i)) {
					// console.log(`x: ${j}, y: ${i}`)
					return {
						"order": this.order,
						"x": j,
						"y": i
					};
				}
			}
		}
		return false;
	}

	// addEventListener(type, callback) {
	// 	this.#event_dispatcher.addEventListener(type, callback);
	// }

	// dispatchEvent(event) {
	// 	this.#event_dispatcher.dispatchEvent(e);
	// }
}