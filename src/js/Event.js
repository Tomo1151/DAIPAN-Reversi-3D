class CustomEvent {
	type;
	time;

	constructor (type) {
		this.type = type;
		this.time = new Date();
	}
}

export class GameStartEvent extends CustomEvent {
	static EVENT_NAME = "game_start";

	constructor () {
		super (GameStartEvent.EVENT_NAME);
	}
}

export class GameOverEvent extends CustomEvent {
	static EVENT_NAME = "game_over";
	result;

	constructor (result) {
		super (GameOverEvent.EVENT_NAME);
		this.result = result;
	}
}

export class GameRestartEvent extends CustomEvent {
	static EVENT_NAME = "game_restart";

	constructor () {
		super (GameRestartEvent.EVENT_NAME);
	}
}

export class ConfirmationEvent extends CustomEvent {
	static EVENT_NAME = "confirmed";
	order;

	constructor (order) {
		super (ConfirmationEvent.EVENT_NAME);
		this.order = order;
	}
}

export class TurnChangeEvent extends CustomEvent {
	static EVENT_NAME = "turn_change";

	constructor () {
		super (TurnChangeEvent.EVENT_NAME);
	}
}

export class TurnNoticeEvent extends CustomEvent {
	static EVENT_NAME = "turn_notice";
	board;
	can_put;
	order;

	constructor (order, board, can_put) {
		super (TurnNoticeEvent.EVENT_NAME);
		this.board = board;
		this.can_put = can_put;
		this.order = order;
	}
}

export class PutNoticeEvent extends CustomEvent {
	static EVENT_NAME = "put_notice";
	#order;
	#x;
	#y;

	constructor (data) {
		super (PutNoticeEvent.EVENT_NAME);
		this.#order = data["order"];
		this.#x = data["x"];
		this.#y = data["y"];
	}

	get order () {return this.#order;}
	get x () {return this.#x;}
	get y () {return this.#y;}
}

export class PutFailEvent extends CustomEvent {
	static EVENT_NAME = "put_fail";
	order;

	constructor (order) {
		super (PutFailEvent.EVENT_NAME);
		this.order = order;
	}
}

export class PutSuccessEvent extends CustomEvent {
	static EVENT_NAME = "put_success";
	order;

	constructor (order) {
		super (PutSuccessEvent.EVENT_NAME);
		this.order = order
	}
}

export class BangNoticeEvent extends CustomEvent {
	static EVENT_NAME = "bang_notice";
	order;
	x;
	y;
	anger = 100;

	constructor (data) {
		super (BangNoticeEvent.EVENT_NAME);
		this.order = data.order;
		this.x = data.x;
		this.y = data.y;
	}
}

export class BangFailEvent extends CustomEvent {
	static EVENT_NAME = "bang_fail";
	order;

	constructor (order) {
		super (BangFailEvent.EVENT_NAME);
		this.order = order;
	}
}

export class BangSuccessEvent extends CustomEvent {
	static EVENT_NAME = "bang_success";
	order;
	pos;

	constructor (data) {
		super (BangSuccessEvent.EVENT_NAME);
		this.order = data.order;
		this.pos = data.pos;
	}
}

export class PutPassEvent extends CustomEvent {
	static EVENT_NAME = "put_pass";
	order;

	constructor (order) {
		super (PutPassEvent.EVENT_NAME);
		this.order = order;
	}
}

export class UpdateCompleteEvent extends CustomEvent {
	static EVENT_NAME = "updated";
	constructor () {super(UpdateCompleteEvent.EVENT_NAME);}
}


// export class EventManager {
// 	#listeners = [];

// 	constructor () {}

// 	addEventListener(event_name, callback) {
// 		if (event_name in this.#listeners) {
// 			this.#listeners[event_name].push(callback);
// 		} else {
// 			this.#listeners[event_name] = [callback];
// 		}
// 	}

// 	dispatchEvent(event, dispatch_object) {
// 		if (event.name in this.#listeners) {
// 			this.#listeners[event.name].forEach((func) => {func(event)});
// 		} else {
// 			console.log(`this object doen't has listener: ${event.name}`);
// 		}
// 	}
// }