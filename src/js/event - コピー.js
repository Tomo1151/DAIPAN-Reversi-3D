class CustomEvent {
	#type;

	constructor (type) {
		this.#type = type;
	}

	get type() {return this.#type;}
}

export class GameStartEvent extends CustomEvent {
	static EVENT_NAME = "game_start";

	constructor () {
		super (GameStartEvent.EVENT_NAME);
	}
}

export class GameOverEvent extends CustomEvent {
	static EVENT_NAME = "game_over";

	constructor () {
		super (GameOverEvent.EVENT_NAME);
	}
}

export class ConfirmationEvent extends CustomEvent {
	static EVENT_NAME = "confirmed";

	constructor () {
		super (ConfirmationEvent.EVENT_NAME);
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
	#can_put;
	#board;

	constructor (board, can_put) {
		super (TurnNoticeEvent.EVENT_NAME);
		this.#board = board;
		this.#can_put = can_put;
	}

	get board () {return this.#board;}
	get can_put () {return this.#can_put;}
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

	constructor (data) {
		super (PutFailEvent.EVENT_NAME);
	}
}

export class PutSuccessEvent extends CustomEvent {
	static EVENT_NAME = "put_success";

	constructor (data) {
		super (PutSuccessEvent.EVENT_NAME);
	}
}

export class PutPassEvent extends CustomEvent {
	static EVENT_NAME = "put_pass";

	constructor () {
		super (PutPassEvent.EVENT_NAME);
	}
}

export class EventManager {
	#listeners = [];

	constructor () {}

	addEventListener(event_name, callback) {
		if (event_name in this.#listeners) {
			this.#listeners[event_name].push(callback);
		} else {
			this.#listeners[event_name] = [callback];
		}
	}

	dispatchEvent(event, dispatch_object) {
		if (event.name in this.#listeners) {
			this.#listeners[event.name].forEach((func) => {func(event)});
		} else {
			console.log(`this object doen't has listener: ${event.name}`);
		}
	}
}