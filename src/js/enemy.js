import * as THREE from 'three';
import { sleep } from "./utils.js"
import Player from "./player.js";
import { Disk } from "./object.js";
import * as Event from "./event.js";

export default class Enemy extends Player {
	MAX_DEPTH = 3;
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

	#current_table;

	constructor (game_manager, order) {
		super(game_manager, order);
		this.name = 'COM';

		this.game_manager.addEventListener('turn_notice', async (e) => {
			if (e.order != this.order) return;
			let board = e.board;
			let event;

			// this.set_table(board.table);
			console.log(this.nega_max(this.get_table_from_board(board), this.order, this.MAX_DEPTH));

			// let map = [
			// 	[2, 2, 2, 2, 2, 2, 2, 2],
			// 	[2, 2, 2, 2, 2, 2, 2, 2],
			// 	[2, 2, 2, 1, 2, 2, 2, 2],
			// 	[2, 2, 2, 1, 1, 2, 2, 2],
			// 	[2, 2, 0, 0, 1, 2, 2, 2],
			// 	[2, 2, 2, 2, 1, 2, 2, 2],
			// 	[2, 2, 2, 2, 2, 2, 2, 2],
			// 	[2, 2, 2, 2, 2, 2, 2, 2]
			// ];

			// console.log(`e: ${this.evaluate(map, this.order)}`)

			if (e.can_put) {
				// console.log(`put ${e.can_put}`)
				const data = this.searchFirst(board);
				event = new Event.PutNoticeEvent(data);
			} else {
				// console.log(`pass ${e.can_put}`)
				// ここで探索
				// おける全ての場所を取得し，その各状況を再現 -> その状況で置ける全ての場所を取得し /以下ループ

				event = new Event.PutPassEvent(this.order);
			}

			await sleep(1000);
			console.log(`enemy send: ${event.type}`);
			this.game_manager.dispatchEvent(event);
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
						row += '〇　';
						break;
					case Disk.BLACK:
						row += '◉　';
						break;
					default:
						row += '・　';
						break;
				}
			}
			console.log(row);
		}
	}

	nega_max(table, order, depth) {
		if (depth == 0) {
			console.log(`eval: ${this.evaluate(table, this.order)}`)
			return this.evaluate(table, this.order);
		}

		let score;
		let max_score = Number.NEGATIVE_INFINITY;
		let positions = this.get_playable_position(table, order);
		let best_position = positions[0];

		console.log(order == Disk.WHITE ? "WHITE": "BLACK")
		console.log(`depth: ${4 - depth}手先`);
		console.log(positions);

		for (let i = 0; i < positions.length; i++) {
			let put_table = this.put_disk(table, order, positions[i].x, positions[i].y);
			// this.view(put_table)

			score = -this.nega_max(put_table, this.get_opponent(order), depth-1);

			console.log(`cur_max: ${max_score} score: ${score}`)

			if (max_score < score) {
				max_score = score;
				if (depth == this.MAX_DEPTH) best_position = positions[i];
			}

			// if (depth%2 == 1) {
			// 	if (max_score < score) {
			// 		max_score = score;
			// 		if (depth == this.MAX_DEPTH) best_position = positions[i];
			// 	};
			// } else {
			// 	if (max_score < -score) {
			// 		max_score = -score;
			// 	};
			// }
			console.log(`cur_max update: ${max_score}`)
		}
		return max_score;
	}

	// search_table(positions) {
	// 	const queue = [];
	// 	const depth = [];
	// 	for (let pos of positions) queue.push(pos);

	// 	while (queue.length > 0) {
	// 		let pos = queue.shift();
	// 	}
	// }

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

		return black - white;

		// console.log{`order: ${order}, pts: ${score}`}
		return scores[(order+1)%2] - scores[order];
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