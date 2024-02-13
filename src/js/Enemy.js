import * as THREE from 'three';
import { sleep } from "./Utils.js"
import Player from "./Player.js";
import { Disk } from "./Object.js";
import * as Event from "./Event.js";

export default class Enemy extends Player {
	#EVALUATION_MAP = [
		[120, -20, 20,  5,  5, 20, -20, 120],
		[-20, -40, -5, -5, -5, -5, -40, -20],
		[ 20,  -5, 15,  3,  3, 15,  -5,  20],
		[  5,  -5,  3,  3,  3,  3,  -5,   5],
		[  5,  -5,  3,  3,  3,  3,  -5,   5],
		[ 20,  -5, 15,  3,  3, 15,  -5,  20],
		[-20, -40, -5, -5, -5, -5, -40, -20],
		[120, -20, 20,  5,  5, 20, -20, 120]
	];

	#worker = new Worker('./js/Search.js');
	#count;

	constructor (gameManager, order) {
		super(gameManager, order);
		this.name = 'COM';
		this.#count = 0;
		this.#worker.addEventListener('message', (e) => {
			console.log(e);
		});

		this.gameManager.addEventListener('turn_notice', async (e) => {
			if (e.order != this.order) return;
			let board = e.board;
			let event;
			this.#count++;
			if (e.canPut) {
				// const data = this.searchFirst(board);
				const data = this.#searchNegaAlpha(this.#getTableFromBoard(board), this.order, 5);

				// 現在の盤面の状況を送り，最適なポジションを返す
				this.#worker.postMessage(data);

				event = new Event.PutNoticeEvent(data);
			} else {
				event = new Event.PutPassEvent(this.order);
			}

			// await sleep(1000);
			this.logger.log(`enemy send: ${event.type}`);
			// console.log(`enemy send: ${event.type}`);
			this.gameManager.dispatchEvent(event);
		});
	}

	init() {
	}

	view(table) {
		for (let i = 0; i < 8; i++) {
			let row = '';
			for (let j = 0; j < 8; j++) {
				let disk_state = table[i][j];
				switch (disk_state) {
					case Disk.WHITE:
						row += 'W　';
						break;
					case Disk.BLACK:
						row += 'B　';
						break;
					default:
						row += '.　';
						break;
				}
			}
			console.log(row);
		}
	}

	#nextSearch(table, order) {
		let score;
		let maxScore = Number.NEGATIVE_INFINITY;
		let positions = this.#getPlayablePosition(table, order);
		let evalPos;

		for (let pos of positions) {
			let putTable = this.#putDisk(table, order, pos.x, pos.y);
			if (this.#jamCheck(putTable, Disk.WHITE)) return {"order": order, "x": pos.x, "y": pos.y};
			score = this.#evaluate(putTable, order);
			console.log(`\t - pos: ${JSON.stringify(pos)}, score: ${score}\n`);
			if (maxScore == score) {
				if (Math.random() > 0.5) {
					maxScore = score;
					evalPos = pos;
				}
			} else if (maxScore < score) {
				maxScore = score;
				evalPos = pos;
			}
		}
		console.log(`\t > max: ${JSON.stringify(evalPos)}`);
		return Object.assign({order}, evalPos);
	}

	#jamCheck(table, target) {
		let isJammed = true;
		for (let i = 0; i < table.length; i++) {
			if (table[i].includes(target)) isJammed = false;
		}
		return isJammed;
	}

	#search_negamax(table, order, depth) {
		let score;
		let maxScore = Number.NEGATIVE_INFINITY;
		let positions = this.#getPlayablePosition(table, order);
		let evalPos = positions[0];

		for (let pos of positions) {
			let putTable = this.#putDisk(table, order, pos.x, pos.y);
			if (this.#jamCheck(putTable, this.#getOpponent(this.order))) return {"order": order, "x": pos.x, "y": pos.y};
			score = -this.#negaMax(putTable, this.#getOpponent(order), depth-1, false);
			console.log(`\t - pos: ${JSON.stringify(pos)}, score: ${score}\n`);
			if (score > maxScore) {
				maxScore = score;
				evalPos = pos;
			}
		}
		console.log(`\t > max: ${JSON.stringify(evalPos)}`);
		return Object.assign({order}, evalPos);
	}

	#negaMax(table, order, depth, isPassed) {
		if (depth == 0) return this.#evaluate(table, order);

		let score;
		let maxScore = Number.NEGATIVE_INFINITY;
		let positions = this.#getPlayablePosition(table, order);

		for (let pos of positions) {
			let putTable = this.#putDisk(table, order, pos.x, pos.y);
			score = -this.#negaMax(putTable, this.#getOpponent(order), depth-1, false);
			maxScore = Math.max(maxScore, score);
		}

		if (maxScore == Number.NEGATIVE_INFINITY) {
			if (isPassed) return this.#evaluate(table, order);
			return -this.#negaMax(table, order, depth, true);
		}

		return maxScore;
	}

	#searchNegaAlpha(table, order, depth) {
		let score;
		let alpha = Number.NEGATIVE_INFINITY;
		let beta = Infinity;
		let positions = this.#getPlayablePosition(table, order);
		let evalPos = positions[0];

		for (let pos of positions) {
			let putTable = this.#putDisk(table, order, pos.x, pos.y);
			if (this.#jamCheck(putTable, this.#getOpponent(this.order))) return {"order": order, "x": pos.x, "y": pos.y};
			score = -this.#negaMax(putTable, this.#getOpponent(order), depth-1, -beta, -alpha, false);
			this.logger.log(`\t - pos: ${JSON.stringify(pos)}, score: ${score}\n`);
			// console.log(`\t - pos: ${JSON.stringify(pos)}, score: ${score}\n`);
			if (alpha == score) {
				if (Math.random() > 0.5) {
					alpha = score;
					evalPos = pos;
				}
			} else if (alpha < score) {
				alpha = score;
				evalPos = pos;
			}
		}
		this.logger.log(`\t > max: ${JSON.stringify(evalPos)}`);
		// console.log(`\t > max: ${JSON.stringify(evalPos)}`);
		return Object.assign({order}, evalPos);
	}

	#negaAlpha(table, order, depth, alpha, beta, isPassed) {
		if (depth == 0) return this.#evaluate(table, order);

		let score;
		let maxScore = Number.NEGATIVE_INFINITY;
		let positions = this.#getPlayablePosition(table, order);

		for (let pos of positions) {
			let putTable = this.#putDisk(table, order, pos.x, pos.y);
			score = -this.#negaMax(putTable, this.#getOpponent(order), depth-1, false);
			if (score >= beta) return score;

			alpha = Math.max(alpha, score);
			maxScore = Math.max(maxScore, score);
		}

		if (maxScore == Number.NEGATIVE_INFINITY) {
			if (isPassed) return this.#evaluate(table, order);
			return -this.#negaAlpha(table, order, depth, -beta, -alpha, true);
		}

		return maxScore;
	}

	#getPlayablePosition(table, order) {
		let positions = []
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				if (this.#putJudgement(table, order, j, i)) {
					positions.push({"x": j,	"y": i});
				}
			}
		}
		return positions;
	}

	#getOpponent(order) {
		if (!(order == Disk.WHITE || order == Disk.BLACK)) return false;
		return (order == Disk.WHITE ? Disk.BLACK : Disk.WHITE);
	}

	#putJudgement(table, order, x, y) {
		if (table[y][x] == Disk.EMPTY) {
			const dr = [-1, -1, -1, 0, 0, 1, 1, 1];
			const dc = [-1, 0, 1, -1, 1, -1, 0, 1];
			for (let i = 0; i < 8; i++) {
				if (this.#countReversible(table, order, x, y, dc[i], dr[i]) > 0) return true;
			}
		}
		return false;
	}

	#countReversible(table, order, x, y, dc, dr) {
		let count = 0;
		let r = y + dr;
		let c = x + dc;

		while (0 <= r && r < 8 && 0 <= c && c < 8) {
			if (table[r][c] == this.#getOpponent(order)) {
				count += 1;
			} else if (table[r][c] == order) {
				return count;
			} else {
				return 0;
			}
			r += dr;
			c += dc;
		}
		return 0;
	}

	#reverseDisks(table, x, y, dc, dr, count) {
		let r = y + dr;
		let c = x + dc;
		for (let i = 0; i < count; i++) {
			table[r][c] = this.#reverse(table[r][c]);
			r += dr;
			c += dc;
		}
		return table;
	}

	#reverse(state) {
		if (state == Disk.EMPTY) return;
		return state == Disk.WHITE ? Disk.BLACK : Disk.WHITE;
	}

	#putDisk(table, order, x, y) {
		const dr = [-1, -1, -1, 0, 0, 1, 1, 1];
		const dc = [-1, 0, 1, -1, 1, -1, 0, 1];
		let cpy = new Array(8);
		for (let i = 0; i < 8; i++) {
			let row = new Array(8);
			for (let j = 0; j < 8; j++) {
				row[j] = table[i][j];
			}
			cpy[i] = row;
		}
		cpy[y][x] = order;
		// console.log(cpy)

		for (let i = 0; i < 8; i++) {
			let count = this.#countReversible(table, order, x, y, dc[i], dr[i]);
			if (count > 0) cpy = this.#reverseDisks(cpy, x, y, dc[i], dr[i], count);
		}

		// console.log(cpy)
		return cpy;
	}

	#getTableFromBoard(board) {
		let table = new Array(8);
		// console.log(board)
		for (let i = 0; i < 8; i++) {
			let row = [];
			for (let j = 0; j < 8; j++) {
				row.push(board.table[i*8+j].state);
			}
			table[i] = row;
		}
		return table;
	}

	#evaluate(table, order) {
		let scores = [0, 0, 0]

		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				scores[table[i][j]] += this.#EVALUATION_MAP[i][j];
			}
		}

		let white = scores[0];
		let black = scores[1];
		return order == Disk.BLACK? black-white: white-black;
	}

	#checkCanPut (board) {
		const dr = [-1, -1, -1, 0, 0, 1, 1, 1];
		const dc = [-1, 0, 1, -1, 1, -1, 0, 1];
		for (let i = 0; i < board.height; i++) {
			for (let j = 0; j < board.height; j++) {
				if (board.putJudgement(this.order, j, i)) {
					console.log(`x: ${j}, y: ${i}`)
					return true;
				}
			}
		}
		return false;
	}

	#searchFirst (board) {
		for (let i = 0; i < board.height; i++) {
			for (let j = 0; j < board.height; j++) {
				if (board.putJudgement(this.order, j, i)) {
					return {"order": this.order, "x": j, "y": i};
				}
			}
		}
		return false;
	}
}