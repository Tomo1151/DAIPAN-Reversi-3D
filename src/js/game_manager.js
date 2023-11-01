class GameManager {
	static BEFORE_START = 0;
	static IN_GAME = 1;
	static GAME_OVER = 2;
	static GAME_STATE = this.BEFORE_START;

	#board = new Board(8, 8);
	#players = new Array(2);
	#current_turn = Disk.BLACK;
	#dest_i;
	#dest_o;
	#event_manager = new EventManager();

	constructor (players) {
		this.#players[0] = players[0];
		this.#players[1] = players[1];

		this.addEventListener('game_start', () => {
			this.object_update();

			// 石を置かれた時
			this.addEventListener('put_notice', (data) => {
				// 置かれた情報
				let order = data["order"];
				let result_event;
				let x = data["x"];
				let y = data["y"];

				this.dest_o = this.findEventDest(this.board.getOpponent(this.current_turn));
				this.dest_i = this.findEventDest(this.current_turn);

				// もし手番なら
				if (this.current_turn == order) {
					// その場に置けるのであれば
					if (this.checkCanPut(x, y)) {
						this.put(x, y);
						// this.object_update();

						result_event = new PutSuccessEvent();

						// gm に置けたことを報告，ターンチェンジの指示
						this.dispatchEvent(result_event);
						this.dispatchEvent(new TurnChangeEvent());
					} else {
						// 手番のプレイヤーに置けなかったことを報告
						result_event = new PutFailEvent();
					}

				} else {
					result_event = new PutFailEvent();
				}

				// 手番のプレイヤーに結果の報告
				this.dest_i.dispatchEvent(result_event);
			});

			// ターンチェンジの指示があったら
			this.addEventListener('turn_change', () => {
				// 次の手番の人が置けるか確認し，その人に報告
				if (this.checkTable(this.board.getOpponent(this.current_turn))) {
					this.dest_o.dispatchEvent(new CanPutNotice());
				} else {
					this.dest_o.dispatchEvent(new CantPutNotice());
				}
			});

			// 石をおけた時
			this.addEventListener('put_success', (e) => {
				console.log("[gm] received: put_success")
				this.object_update();

				this.dest_o = this.findEventDest(this.board.getOpponent(this.current_turn));
				this.dest_i = this.findEventDest(this.current_turn);

						console.log(`check game_over: ${this.checkGameOver()}`)

						if (this.checkGameOver()) {
							console.log("Game Over")
							const game_over = new GameOverEvent();
							this.boroadcastGameEvent(game_over);
							return;
						}

						let turn_notice = new TurnNoticeEvent(this.board);
						this.changeTurn();
						this.dest_o.dispatchEvent(turn_notice);

			})

			// プレイヤーからパスの指示を受けたら
			this.addEventListener('put_pass', () => {
				this.changeTurn();
			})

			// 初回
			console.log("[event] : gamestart");
			let turn_notice = new TurnNoticeEvent(this.board);
			this.findEventDest(this.current_turn).dispatchEvent(turn_notice);
			this.findEventDest(this.current_turn).dispatchEvent(new CanPutNotice());

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

	checkGameOver () {
		if (!this.checkTable(Disk.BLACK) && !this.checkTable(Disk.WHITE)) {
			return true;
		} else {
			return false;
		}
	}

	boroadcastGameEvent (event) {
		for (let player of this.players) {
			player.dispatchEvent(event);
		}
	}

	checkTable (order) {
		for (let i = 0; i < this.board.height; i++) {
			for (let j = 0; j < this.board.width; j++) {
				if (this.board.putJudgement(order, j, i)) {
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

	get dest_i () {return this.#dest_i;}
	get dest_o () {return this.#dest_o;}
	get board () {return this.#board;}
	get players () {return this.#players;}
	get current_turn () {return this.#current_turn;}

	set dest_i (dest_i) {this.#dest_i = dest_i;}
	set dest_o (dest_o) {this.#dest_o = dest_o;}

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