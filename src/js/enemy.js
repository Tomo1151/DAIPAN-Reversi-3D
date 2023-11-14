import * as THREE from 'three';
import { sleep } from "./utils.js"
import Player from "./player.js";
import * as Event from "./event.js";

export default class Enemy extends Player {

	constructor (game_manager, order) {
		super(game_manager, order);
		this.name = 'enemy';

		this.game_manager.addEventListener('turn_notice', async (e) => {
			if (e.order != this.order) return;
			let board = e.board;
			let event;

			if (e.can_put) {
				const data = this.searchFirst(board);
				event = new Event.PutNoticeEvent(data);
			} else {
				event = new Event.PutPassEvent();
			}

			await sleep(1000);
			console.log(`enemy send: ${event.type}`);
			this.game_manager.dispatchEvent(event);
		});
	}

	init() {
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
}