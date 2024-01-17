import * as THREE from 'three';
import { sleep } from "./Utils.js"
import Player from "./Player.js";
import { Disk } from "./Object.js";
import * as Event from "./Event.js";

export default class Enemy extends Player {
	#evalueation_map = [
		[120, -20, 20,  5,  5, 20, -20, 120],
		[-20, -40, -5, -5, -5, -5, -40, -20],
		[ 20,  -5, 15,  3,  3, 15,  -5,  20],
		[  5,  -5,  3,  3,  3,  3,  -5,   5],
		[  5,  -5,  3,  3,  3,  3,  -5,   5],
		[ 20,  -5, 15,  3,  3, 15,  -5,  20],
		[-20, -40, -5, -5, -5, -5, -40, -20],
		[120, -20, 20,  5,  5, 20, -20, 120]
	];

	#count;
	#current_table;

	constructor (gameManager, order) {
		super(gameManager, order);
		this.name = 'COM';
		this.#count = 0;
		this.gameManager.addEventListener('turn_notice', async (e) => {
			if (e.order != this.order) return;
			let board = e.board;
			let event;
			this.#count++;
			if (e.can_put) {
				// const data = this.searchFirst(board);
				const data = this.search_negaalpha(this.get_table_from_board(board), this.order, 7);
				// let depth = (this.#count > 25) ? (32 - this.#count)*2 : 5;
				// const data = this.search_negaalpha(this.get_table_from_board(board), this.order, depth);
				// console.log(`count: ${this.#count} | search depth: ${depth}`);
				event = new Event.PutNoticeEvent(data);
			} else {
				event = new Event.PutPassEvent(this.order);
			}

			// await sleep(1000);
			console.log(`enemy send: ${event.type}`);
			this.gameManager.dispatchEvent(event);
		});
	}

	init() {
	}

	view(table) {
		// console.log(table)
		for (let i = 0; i < 8; i++) {
			// console.log();
			let row = '';
			for (let j = 0; j < 8; j++) {
				let disk_state = table[i][j];
				// console.log(disk_state)
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

	next_search(table, order) {
		let score;
		let max_score = Number.NEGATIVE_INFINITY;
		let positions = this.get_playable_position(table, order);
		let eval_pos;

		for (let pos of positions) {
			let put_table = this.put_disk(table, order, pos.x, pos.y);
			if (this.jam_check(put_table, Disk.WHITE)) return {"order": order, "x": pos.x, "y": pos.y};
			score = this.evaluate(put_table, order);
			console.log(`\t - pos: ${JSON.stringify(pos)}, score: ${score}\n`);
			if (max_score == score) {
				if (Math.random() > 0.5) {
					max_score = score;
					eval_pos = pos;
				}
			} else if (max_score < score) {
				max_score = score;
				eval_pos = pos;
			}
		}
		console.log(`\t > max: ${JSON.stringify(eval_pos)}`);
		return Object.assign({"order": order}, eval_pos);
	}

	jam_check(table, target) {
		let is_jammed = true;
		for (let i = 0; i < table.length; i++) {
			if (table[i].includes(target)) is_jammed = false;
		}
		return is_jammed;
	}

	search_negamax(table, order, depth) {
		let score;
		let max_score = Number.NEGATIVE_INFINITY;
		let positions = this.get_playable_position(table, order);
		let eval_pos = positions[0];

		for (let pos of positions) {
			let put_table = this.put_disk(table, order, pos.x, pos.y);
			if (this.jam_check(put_table, this.get_opponent(this.order))) return {"order": order, "x": pos.x, "y": pos.y};
			score = -this.nega_max(put_table, this.get_opponent(order), depth-1, false);
			console.log(`\t - pos: ${JSON.stringify(pos)}, score: ${score}\n`);
			if (score > max_score) {
				max_score = score;
				eval_pos = pos;
			}
		}
		console.log(`\t > max: ${JSON.stringify(eval_pos)}`);
		return Object.assign({"order": order}, eval_pos);
	}

	nega_max(table, order, depth, is_passed) {
		if (depth == 0) return this.evaluate(table, order);

		let score;
		let max_score = Number.NEGATIVE_INFINITY;
		let positions = this.get_playable_position(table, order);

		for (let pos of positions) {
			let put_table = this.put_disk(table, order, pos.x, pos.y);
			score = -this.nega_max(put_table, this.get_opponent(order), depth-1, false);
			max_score = Math.max(max_score, score);
		}

		if (max_score == Number.NEGATIVE_INFINITY) {
			if (is_passed) return this.evaluate(table, order);
			return -this.nega_max(table, order, depth, true);
		}

		return max_score;
	}

	search_negaalpha(table, order, depth) {
		let score;
		let alpha = Number.NEGATIVE_INFINITY;
		let beta = Infinity;
		let positions = this.get_playable_position(table, order);
		let eval_pos = positions[0];

		for (let pos of positions) {
			let put_table = this.put_disk(table, order, pos.x, pos.y);
			if (this.jam_check(put_table, this.get_opponent(this.order))) return {"order": order, "x": pos.x, "y": pos.y};
			score = -this.nega_max(put_table, this.get_opponent(order), depth-1, -beta, -alpha, false);
			console.log(`\t - pos: ${JSON.stringify(pos)}, score: ${score}\n`);
			if (alpha == score) {
				if (Math.random() > 0.5) {
					alpha = score;
					eval_pos = pos;
				}
			} else if (alpha < score) {
				alpha = score;
				eval_pos = pos;
			}
		}
		console.log(`\t > max: ${JSON.stringify(eval_pos)}`);
		return Object.assign({"order": order}, eval_pos);
	}

	nega_alpha(table, order, depth, alpha, beta, is_passed) {
		if (depth == 0) return this.evaluate(table, order);

		let score;
		let max_score = Number.NEGATIVE_INFINITY;
		let positions = this.get_playable_position(table, order);

		for (let pos of positions) {
			let put_table = this.put_disk(table, order, pos.x, pos.y);
			score = -this.nega_max(put_table, this.get_opponent(order), depth-1, false);
			if (score >= beta) return score;

			alpha = Math.max(alpha, score);
			max_score = Math.max(max_score, score);
		}

		if (max_score == Number.NEGATIVE_INFINITY) {
			if (is_passed) return this.evaluate(table, order);
			return -this.nega_alpha(table, order, depth, -beta, -alpha, true);
		}

		return max_score;
	}

	get_playable_position(table, order) {
		let positions = []
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				if (this.put_judgement(table, order, j, i)) {
					positions.push({"x": j,	"y": i});
				}
			}
		}
		return positions;
	}

	get_opponent(order) {
		if (!(order == Disk.WHITE || order == Disk.BLACK)) return false;
		return (order == Disk.WHITE ? Disk.BLACK : Disk.WHITE);
	}

	put_judgement(table, order, x, y) {
		if (table[y][x] == Disk.EMPTY) {
			const dr = [-1, -1, -1, 0, 0, 1, 1, 1];
			const dc = [-1, 0, 1, -1, 1, -1, 0, 1];
			for (let i = 0; i < 8; i++) {
				if (this.count_reversible(table, order, x, y, dc[i], dr[i]) > 0) return true;
			}
		}
		return false;
	}

	count_reversible(table, order, x, y, dc, dr) {
		let count = 0;
		let r = y + dr;
		let c = x + dc;

		while (0 <= r && r < 8 && 0 <= c && c < 8) {
			if (table[r][c] == this.get_opponent(order)) {
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

	reverse_disks(table, x, y, dc, dr, count) {
		let r = y + dr;
		let c = x + dc;
		for (let i = 0; i < count; i++) {
			table[r][c] = this.reverse(table[r][c]);
			r += dr;
			c += dc;
		}
		return table;
	}

	reverse(state) {
		if (state == Disk.EMPTY) return;
		return state == Disk.WHITE ? Disk.BLACK : Disk.WHITE;
	}

	put_disk(table, order, x, y) {
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
			let count = this.count_reversible(table, order, x, y, dc[i], dr[i]);
			if (count > 0) cpy = this.reverse_disks(cpy, x, y, dc[i], dr[i], count);
		}

		// console.log(cpy)
		return cpy;
	}

	get_table_from_board(board) {
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

	evaluate(table, order) {
		let scores = [0, 0, 0]

		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				scores[table[i][j]] += this.#evalueation_map[i][j];
			}
		}

		let white = scores[0];
		let black = scores[1];
		return order == Disk.BLACK? black-white: white-black;
		// return black - white;

		// console.log{`order: ${order}, pts: ${score}`}
		// return scores[(order+1)%2] - scores[order];
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
		for (let i = 0; i < board.height; i++) {
			for (let j = 0; j < board.height; j++) {
				if (board.putJudgement(this.order, j, i)) {
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