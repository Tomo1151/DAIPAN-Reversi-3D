"use strict";
console.log("Hello, world!");

class Enemy {
	#order;

	constructor (order) {
		this.#order = order;
	}

	get order() {return this.#order;}

	searchFirst(board) {
		const dr = [-1, -1, -1, 0, 0, 1, 1, 1];
		const dc = [-1, 0, 1, -1, 1, -1, 0, 1];
		for (let i = 0; i < board.height; i++) {
			// console.log("b")
			for (let j = 0; j < board.height; j++) {
				if (board.putJudgement(this.order, j, i)) {
					console.log(`x: ${j}, y: ${i}`)
					board.putDisk(this.order, j, i);
					return true;
				}
			}
		}
		return false;
	}
}

class Disk {
	static WHITE = 0;
	static BLACK = 1;
	static EMPTY = 2;

	#x;
	#y;
	#state = Disk.EMPTY;

	constructor (x, y) {
		this.#x = x;
		this.#y = y;
	}

	get x() {return this.#x;}
	get y() {return this.#y;}
	get state() {return this.#state;}

	set x(x) {this.#x = x;}
	set y(y) {this.#y = y;}
	set state(state) {this.#state = state;}

	put(order) {
		if (this.state != Disk.EMPTY) return false;
		order == Disk.WHITE ? this.state = Disk.WHITE : this.state = Disk.BLACK;
	}

	reverse() {
		if (this.state == Disk.EMPTY) return false;
		this.state == Disk.WHITE ? this.state = Disk.BLACK : this.state = Disk.WHITE;
	}
}

class Board {
	#width;
	#height;
	#table = new Array();

	constructor (width, height) {
		this.#width = width;
		this.#height = height;

		for (let i = 0; i < height; i++) {
			for (let j = 0; j < width; j++) {
				let disk = new Disk(j, i);
				this.#table.push(disk);
			}
		}

		this.init();
	}

	get table() {return this.#table}
	get width() {return this.#width}
	get height() {return this.#height}

	init() {
		this.getDisk(3, 3).put(Disk.WHITE);
		this.getDisk(4, 3).put(Disk.BLACK);
		this.getDisk(3, 4).put(Disk.BLACK);
		this.getDisk(4, 4).put(Disk.WHITE);
	}

	getOpponent(order) {
		if (!(order == Disk.WHITE || order == Disk.BLACK)) return false;
		return (order == Disk.WHITE ? Disk.BLACK : Disk.WHITE);
	}

	getDisk(x, y) {return this.table.find(disk => disk.x == x && disk.y == y);}

	countReversible(order, x, y, dc, dr) {
		let count = 0;
		let r = y + dr;
		let c = x + dc;

		// console.log(`width: ${this.width}, height: ${this.height}`)
		// console.log(`r: ${r}, c: ${c}`)

		while (0 <= r && r < this.height && 0 <= c && c < this.width) {
			if (this.getDisk(c, r).state == this.getOpponent(order)) {
				// console.log("a")
				count += 1;
			} else if (this.getDisk(c, r).state == order) {
				// console.log("b")
				return count;
			} else {
				// console.log("c")
				return 0;
			}

			r += dr;
			c += dc;
		}
		// console.log("d")
		return 0;
	}

	putJudgement(order, x, y) {
		// console.log(`x: ${x}, y: ${y}, dx: ${this.getDisk(x, y).x}, dy: ${this.getDisk(x, y).y}, state: ${this.getDisk(x, y).state}`)
		if (this.getDisk(x, y).state == Disk.EMPTY) {
		// console.log("b")
			const dr = [-1, -1, -1, 0, 0, 1, 1, 1];
			const dc = [-1, 0, 1, -1, 1, -1, 0, 1];
			for (let i = 0; i < 8; i++) {
				if (this.countReversible(order, x, y, dc[i], dr[i]) > 0) return true;
			}
		}

		return false;
	}

	reverseDisks(x, y, dc, dr, count) {
		let r = y + dr;
		let c = x + dc;
		for (let i = 0; i < count; i++) {
			this.getDisk(c, r).reverse();
			r += dr;
			c += dc;
		}
	}

	putDisk(order, x, y) {
		// if (this.getDisk(x, y).state == Disk.EMPTY) {
			if (this.putJudgement(order, x, y)) {
				const dr = [-1, -1, -1, 0, 0, 1, 1, 1];
				const dc = [-1, 0, 1, -1, 1, -1, 0, 1];
				if (this.getDisk(x, y).state != Disk.EMPTY) return false;

				this.getDisk(x, y).state = order;

				for (let i = 0; i < 8; i++) {
					let count = this.countReversible(order, x, y, dc[i], dr[i]);
					if (count > 0) this.reverseDisks(x, y, dc[i], dr[i], count);
				}
				this.view();
				return true;
			}
		// }

		this.view();
		return false;
	}

	info() {
		let states = new Array(this.width * this.height);
		for (let i = 0; i < states.length; i++) {
			states[i] = this.table[i].state;
		}

		return {
			"width": this.width,
			"height": this.height,
			"table": states
		};
	}

	view() {
		for (let i = 0; i < this.#height; i++) {
			// console.log();
			let row = '';
			for (let j = 0; j < this.#width; j++) {
				let disk_state = this.#table[this.#width * i + j].state;
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
}

class GameManager {
	static BEFORE_START = 0;
	static IN_GAME = 1;
	static GAME_OVER = 2;
	static GAME_STATE = this.BEFORE_START;

	#board;
	#current_turn = Disk.BLACK;
	#enemy;

	constructor (board, enemy) {
		this.#board = board;
		this.#enemy = enemy;
	}

	checkTable (order) {
		for (let i = 0; i < board.height; i++) {
			for (let j = 0; j < board.width; j++) {
				if (board.putJudgement(order, j, i)) {
					return true;
				}
			}
		}
		return false;
	}

	put(x, y) {
		if (this.current_turn != this.enemy.order) {
			this.board.putDisk(board.getOpponent(this.enemy.order), x, y);
			changeTurn();
		} else {

			console.log("not in your turn.");
		}
	}


	async run () {
		let turn = 0;
		let point = 0;



		// while (true) {


		// 	turn += 1;
		// }
	}

	get board () {return this.#board;}
	get current_turn () {return this.#current_turn;}
	get enemy () {return this.#enemy;}

	changeTurn () {
		this.current_turn == Disk.BLACK ? this.#current_turn = Disk.WHITE : this.#current_turn = Disk.BLACK;
	}
}

const embedToTable = (board_table, table_doms) => {
	let disk = '';
	for (let i = 0; i < table_doms.length; i++) {
		disk = '';
		switch (board_table[i].state) {
			case Disk.WHITE:
				disk = '○';
				break;
			case Disk.BLACK:
				disk = '◉';
				break;
		}
		table_doms[i].innerText = disk;
	}
}

const board = new Board(8, 8);
const enemy = new Enemy(Disk.BLACK);

window.addEventListener('load', () => {
	const gm = new GameManager(board, enemy);
	enemy.searchFirst(gm.board);
	gm.changeTurn();

	let table_cells = document.querySelectorAll("td");
	for (let i = 0; i < table_cells.length; i++) {
		table_cells[i].addEventListener('click', () => {
			let order = gm.board.getOpponent(gm.enemy.order);
			let x = i%gm.board.width;
			let y = Math.floor(i/gm.board.width);
			if (gm.current_turn == order) {
				if (gm.board.putJudgement(order, x, y)){
					gm.board.putDisk(order, x, y);
					embedToTable(gm.board.table, table_cells)
					gm.changeTurn();
					enemy.searchFirst(gm.board);
					gm.changeTurn();
					embedToTable(gm.board.table, table_cells)
				} else {
					console.log("Can't put there.");
				}
			}
		});
	}
	// console.log(table_cells)
	embedToTable(board.table, table_cells)


	// board.view();
	// console.log(enemy.searchFirst(board));
	// gm.board.view();
	// console.log(board.info());
	// console.log(board.table);
});