class GameManager {
	static BEFORE_START = 0;
	static IN_GAME = 1;
	static GAME_OVER = 2;
	static GAME_STATE = this.BEFORE_START;

	#board = new Board(8, 8);
	#players = new Array(2);
	#current_turn = Disk.BLACK;
	#event_manager = new EventManager();

	constructor (players) {
		this.#players[0] = players[0];
		this.#players[1] = players[1];

		this.addEventListener('game_start', () => {
			this.object_update();

			this.addEventListener('put_notice', (data) => {
				let order = data["order"];
				let result_event;
				let x = data["x"];
				let y = data["y"];

				console.log(data)

				// let player = this.findEventDest(order);
				// let enemy = this.findEnemy();
				let dest_o = this.findEventDest(this.board.getOpponent(this.current_turn));
				let dest_i = this.findEventDest(this.current_turn);

				if (this.current_turn == order) {
					if (this.checkCanPut(x, y)) {
						this.put(x, y);
						this.object_update();

						if (!this.checkTable(Disk.BLACK) && !this.checkTable(Disk.WHITE)) {
							console.log("GAME_OVER");
							const game_over = new GameOverEvent();

							this.players[0].dispatchEvent(game_over);
							this.players[1].dispatchEvent(game_over);

							return;
						}

						let turn_notice = new TurnNoticeEvent(this.board);
						this.changeTurn();
						dest_o.dispatchEvent(turn_notice);

						result_event = new PutSuccessEvent();
						this.dispatchEvent(result_event);
					} else {
						result_event = new PutFailEvent();
					}

				} else {
					result_event = new PutFailEvent();
				}

				dest_i.dispatchEvent(result_event);
			});

			this.addEventListener('put_success', () => {
				// console.log(this.board)
				// console.log("event: in gm")
				this.object_update();
			})

			this.addEventListener('put_pass', () => {
				this.changeTurn();
			})

			console.log("event: gamestart");
			let turn_notice = new TurnNoticeEvent(this.board);
			this.findEventDest(this.current_turn).dispatchEvent(turn_notice);


		});
	}

	addEventListener(event_name, callback) {
		this.#event_manager.addEventListener(event_name, callback);
	}

	dispatchEvent (event, dispatch_object) {
		this.#event_manager.dispatchEvent(event, dispatch_object);
	}

	findEventDest (order) {
		return this.players.find(p => p.order == order);
	}

	findEnemy () {
		return this.players.find(p => p.name == 'enemy');
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

	checkCanPut(x, y) {
		return this.#board.putJudgement(this.current_turn, x, y);
	}

	put (x, y) {
		this.board.putDisk(this.current_turn, x, y);
		// this.board.view();
	}

	object_update() {
		show_models(this.board);
	}

	get board () {return this.#board;}
	get players () {return this.#players;}
	get current_turn () {return this.#current_turn;}

	changeTurn () {
		this.current_turn == Disk.BLACK ? this.#current_turn = Disk.WHITE : this.#current_turn = Disk.BLACK;

		let div = document.getElementById('order_div');
		if (this.current_turn == Disk.BLACK) {
			div.children[0].innerText = 'BLACK';
			div.classList.remove('order-white');
			div.classList.add('order-black');
		} else {
			div.children[0].innerText = 'WHITE';
			div.classList.remove('order-black');
			div.classList.add('order-white');
		}
	}
}