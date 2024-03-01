export class Disk {
	static WHITE = 0;
	static BLACK = 1;
	static EMPTY = 2;

	x;
	y;
	state = Disk.EMPTY;

	constructor (x, y) {
		this.x = x;
		this.y = y;
	}

	// get x() {return this.#x;}
	// get y() {return this.#y;}
	// get state() {return this.#state;}

	// set x(x) {this.#x = x;}
	// set y(y) {this.#y = y;}
	// set state(state) {this.#state = state;}

	put(order) {
		if (this.state != Disk.EMPTY) return false;
		order == Disk.WHITE ? this.state = Disk.WHITE : this.state = Disk.BLACK;
	}

	reverse() {
		if (this.state == Disk.EMPTY) return false;
		this.state == Disk.WHITE ? this.state = Disk.BLACK : this.state = Disk.WHITE;
	}
}

export class Board {
	#shockThreshold = 200;
	width;
	height;
	table = new Array();

	constructor (width, height) {
		this.width = width;
		this.height = height;

		for (let i = 0; i < height; i++) {
			for (let j = 0; j < width; j++) {
				let disk = new Disk(j, i);
				this.table.push(disk);
			}
		}

		this.init();
	}

	get shockThreshold() {return this.#shockThreshold;}

	init() {
		this.getDisk(3, 3).put(Disk.WHITE);
		this.getDisk(4, 3).put(Disk.BLACK);
		this.getDisk(3, 4).put(Disk.BLACK);
		this.getDisk(4, 4).put(Disk.WHITE);
	}

	count(order) {
		if (order == Disk.WHITE || order == Disk.BLACK) {
			return this.table.filter(e => e.state == order).length;
		} else {
			return false;
		}
	}

	raffle(order, x, y, anger) {
		// let str = '';
		let pos = [];
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				// str += `(${j}, ${i})`;
				if (this.getDisk(j, i).state == Disk.EMPTY) continue;
				let dist = Math.sqrt(((j*100+50 - x) ** 2) + ((i*100+50 - y) ** 2));
				if (dist < this.#shockThreshold) {
					// console.log(`prob: ${1-(dist/this.#shockThreshold)}`)
					let div = (this.getDisk(j, i).state == Disk.BLACK) ? 1.15 : 0.75;
					let prob = 1-(dist/this.#shockThreshold / div);
					// console.log(`${j}, ${i}, ${dist} [${this.getDisk(j, i).state == 0? 'WHITE': 'BLACK'}]: ${prob}`);
					// if (Math.random() < prob) {
					if (true) {
						// console.log(`\t- (${j}, ${i}) -> distance: ${dist}`);
						this.getDisk(j, i).reverse();
						pos.push({"x": j, "y": i});
					}
				}
			}
			// console.log(str);
			// str = '';
		}

		// this.view();
		return pos;
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
				// this.view();
				return true;
			}
		// }

		// this.view();
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
		for (let i = 0; i < this.height; i++) {
			// console.log();
			let row = '';
			for (let j = 0; j < this.width; j++) {
				let diskState = this.table[this.width * i + j].state;
				switch (diskState) {
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