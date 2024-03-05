import { Disk } from "./Object.js";

(function(){
	let EVALUATION_MAP = [
		[120, -20, 20,  5,  5, 20, -20, 120],
		[-20, -40, -5, -5, -5, -5, -40, -20],
		[ 20,  -5, 15,  3,  3, 15,  -5,  20],
		[  5,  -5,  3,  3,  3,  3,  -5,   5],
		[  5,  -5,  3,  3,  3,  3,  -5,   5],
		[ 20,  -5, 15,  3,  3, 15,  -5,  20],
		[-20, -40, -5, -5, -5, -5, -40, -20],
		[120, -20, 20,  5,  5, 20, -20, 120]
	];

	const COM_ORDER = Disk.BLACK

	self.addEventListener('message', (e) => {
		// console.log(e);
		switch (e.data.type) {
			case "search":
				const board = e.data.table;
				const res = searchNegaMax(getTableFromBoard(board), COM_ORDER, 5);
				// console.log(EVALUATION_MAP);
				self.postMessage({type: 'search', pos: res});

				break
			case 'corner':
				let inv = (e.data.order == COM_ORDER) ? 1 : -1;
				switch (e.data.corner) {
					case 'LU':
						EVALUATION_MAP[0][1] = 20 * inv;
						EVALUATION_MAP[1][1] = 40 * inv;
						EVALUATION_MAP[1][0] = 20 * inv;
						break;
					case 'RU':
						EVALUATION_MAP[0][6] = 20 * inv;
						EVALUATION_MAP[1][6] = 40 * inv;
						EVALUATION_MAP[1][7] = 20 * inv;
						break;
					case 'LD':
						EVALUATION_MAP[6][0] = 20 * inv;
						EVALUATION_MAP[6][1] = 40 * inv;
						EVALUATION_MAP[7][1] = 20 * inv;
						break;
					case 'RD':
						EVALUATION_MAP[6][7] = 20 * inv;
						EVALUATION_MAP[6][6] = 40 * inv;
						EVALUATION_MAP[7][6] = 20 * inv;
						break;
				}
				break;
		}
	});

	function jamCheck(table, target) {
		let isJammed = true;
		for (let i = 0; i < table.length; i++) {
			if (table[i].includes(target)) isJammed = false;
		}
		return isJammed;
	}

	function searchNegaMax(table, order, depth) {
		let score;
		let maxScore = Number.NEGATIVE_INFINITY;
		let positions = getPlayablePosition(table, order);
		let evalPos = positions[0];

		for (let pos of positions) {
			let putTable = putDisk(table, order, pos.x, pos.y);
			if (jamCheck(putTable, getOpponent(COM_ORDER))) return {"order": order, "x": pos.x, "y": pos.y};
			score = -negaMax(putTable, getOpponent(COM_ORDER), depth-1, false);
			// console.log(`\t - pos: ${JSON.stringify(pos)}, score: ${score}\n`);
			if (score > maxScore) {
				maxScore = score;
				evalPos = pos;
			}
		}
		// console.log(`\t > max: ${JSON.stringify(evalPos)}`);
		return Object.assign({"order": order}, evalPos);
	}

	function negaMax(table, order, depth, isPassed) {
		if (depth == 0) return evaluate(table, order);

		let score;
		let maxScore = Number.NEGATIVE_INFINITY;
		let positions = getPlayablePosition(table, order);

		for (let pos of positions) {
			let putTable = putDisk(table, order, pos.x, pos.y);
			score = -negaMax(putTable, getOpponent(order), depth-1, false);
			maxScore = Math.max(maxScore, score);
		}

		if (maxScore == Number.NEGATIVE_INFINITY) {
			if (isPassed) return evaluate(table, order);
			return -negaMax(table, order, depth, true);
		}

		return maxScore;
	}

	function searchNegaAlpha(table, order, depth) {
		let score;
		let alpha = Number.NEGATIVE_INFINITY;
		let beta = Infinity;
		let positions = getPlayablePosition(table, order);
		let evalPos = positions[0];

		for (let pos of positions) {
			let putTable = putDisk(table, order, pos.x, pos.y);
			if (jamCheck(putTable, getOpponent(COM_ORDER))) return {"order": order, "x": pos.x, "y": pos.y};
			score = -negaAlpha(putTable, getOpponent(order), depth-1, -beta, -alpha, false);
			// console.log(`\t - pos: ${JSON.stringify(pos)}, score: ${score}\n`);
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
		// console.log(`\t > max: ${JSON.stringify(evalPos)}`);
		// console.log(`\t > max: ${JSON.stringify(evalPos)}`);
		return Object.assign({order}, evalPos);
	}

	function negaAlpha(table, order, depth, alpha, beta, isPassed) {
		if (depth == 0) return evaluate(table, order);

		let score;
		let maxScore = Number.NEGATIVE_INFINITY;
		let positions = getPlayablePosition(table, order);

		for (let pos of positions) {
			let putTable = putDisk(table, order, pos.x, pos.y);
			score = -negaAlpha(putTable, getOpponent(order), depth-1, -beta, -alpha, false);
			if (score >= beta) return score;

			alpha = Math.max(alpha, score);
			maxScore = Math.max(maxScore, score);
		}

		if (maxScore == Number.NEGATIVE_INFINITY) {
			if (isPassed) return evaluate(table, order);
			return -negaAlpha(table, order, depth, -beta, -alpha, true);
		}

		return maxScore;
	}

	function getPlayablePosition(table, order) {
		let positions = []
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				if (putJudgement(table, order, j, i)) {
					positions.push({x: j, y: i});
				}
			}
		}
		return positions;
	}

	function getOpponent(order) {
		if (!(order == Disk.WHITE || order == Disk.BLACK)) return false;
		return (order == Disk.WHITE ? Disk.BLACK : Disk.WHITE);
	}

	function putJudgement(table, order, x, y) {
		if (table[y][x] == Disk.EMPTY) {
			const dr = [-1, -1, -1, 0, 0, 1, 1, 1];
			const dc = [-1, 0, 1, -1, 1, -1, 0, 1];
			for (let i = 0; i < 8; i++) {
				if (countReversible(table, order, x, y, dc[i], dr[i]) > 0) return true;
			}
		}
		return false;
	}

	function countReversible(table, order, x, y, dc, dr) {
		let count = 0;
		let r = y + dr;
		let c = x + dc;

		while (0 <= r && r < 8 && 0 <= c && c < 8) {
			if (table[r][c] == getOpponent(order)) {
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

	function reverseDisks(table, x, y, dc, dr, count) {
		let r = y + dr;
		let c = x + dc;
		for (let i = 0; i < count; i++) {
			table[r][c] = reverse(table[r][c]);
			r += dr;
			c += dc;
		}
		return table;
	}

	function reverse(state) {
		if (state == Disk.EMPTY) return;
		return state == Disk.WHITE ? Disk.BLACK : Disk.WHITE;
	}

	function putDisk(table, order, x, y) {
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
			let count = countReversible(table, order, x, y, dc[i], dr[i]);
			if (count > 0) cpy = reverseDisks(cpy, x, y, dc[i], dr[i], count);
		}

		// console.log(cpy)
		return cpy;
	}

	function getTableFromBoard(board) {
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

	function evaluate(table, order) {
		let scores = [0, 0, 0]

		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				scores[table[i][j]] += EVALUATION_MAP[i][j];
			}
		}

		let white = scores[0];
		let black = scores[1];
		// console.log(scores)
		return order == Disk.BLACK? black-white: white-black;
	}

	function checkCanPut (board) {
		const dr = [-1, -1, -1, 0, 0, 1, 1, 1];
		const dc = [-1, 0, 1, -1, 1, -1, 0, 1];
		for (let i = 0; i < board.height; i++) {
			for (let j = 0; j < board.height; j++) {
				if (putJudgement(getTableFromBoard(board), COM_ORDER, j, i)) {
					console.log(`x: ${j}, y: ${i}`)
					return true;
				}
			}
		}
		return false;
	}
})();