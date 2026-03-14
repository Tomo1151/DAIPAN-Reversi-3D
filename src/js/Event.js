class CustomEvent {
  #type;
  #time;

  constructor(type) {
    this.#type = type;
    this.#time = new Date();
  }

  get type() {
    return this.#type;
  }
  get time() {
    return this.#time;
  }
}

export class GameStartEvent extends CustomEvent {
  static EVENT_NAME = "game_start";
  #options;

  constructor(options = {}) {
    super(GameStartEvent.EVENT_NAME);
    this.#options = options;
  }

  get options() {
    return this.#options;
  }
}

export class GameOverEvent extends CustomEvent {
  static EVENT_NAME = "game_over";
  #result;

  constructor(result) {
    super(GameOverEvent.EVENT_NAME);
    this.#result = result;
  }

  get result() {
    return this.#result;
  }
}

export class GameRestartEvent extends CustomEvent {
  static EVENT_NAME = "game_restart";
  #fromRemote;

  constructor(fromRemote = false) {
    super(GameRestartEvent.EVENT_NAME);
    this.#fromRemote = fromRemote;
  }

  get fromRemote() {
    return this.#fromRemote;
  }
}

export class ConfirmationEvent extends CustomEvent {
  static EVENT_NAME = "confirmed";
  #order;

  constructor(order) {
    super(ConfirmationEvent.EVENT_NAME);
    this.#order = order;
  }

  get order() {
    return this.#order;
  }
}

export class TurnChangeEvent extends CustomEvent {
  static EVENT_NAME = "turn_change";

  constructor() {
    super(TurnChangeEvent.EVENT_NAME);
  }
}

export class TurnNoticeEvent extends CustomEvent {
  static EVENT_NAME = "turn_notice";
  #board;
  #canPut;
  #order;

  constructor(order, board, canPut) {
    super(TurnNoticeEvent.EVENT_NAME);
    this.#board = board;
    this.#canPut = canPut;
    this.#order = order;
  }

  get board() {
    return this.#board;
  }
  get canPut() {
    return this.#canPut;
  }
  get order() {
    return this.#order;
  }
}

export class PutNoticeEvent extends CustomEvent {
  static EVENT_NAME = "put_notice";
  #order;
  #x;
  #y;
  #fromRemote;

  constructor(data) {
    super(PutNoticeEvent.EVENT_NAME);
    this.#order = data.order;
    this.#x = data.x;
    this.#y = data.y;
    this.#fromRemote = data.fromRemote || false;
  }

  get order() {
    return this.#order;
  }
  get x() {
    return this.#x;
  }
  get y() {
    return this.#y;
  }
  get fromRemote() {
    return this.#fromRemote;
  }
}

export class PutFailEvent extends CustomEvent {
  static EVENT_NAME = "put_fail";
  #order;

  constructor(order) {
    super(PutFailEvent.EVENT_NAME);
    this.#order = order;
  }

  get order() {
    return this.#order;
  }
}

export class PutSuccessEvent extends CustomEvent {
  static EVENT_NAME = "put_success";
  #order;
  #pos;
  #count;

  constructor(order, pos, count) {
    super(PutSuccessEvent.EVENT_NAME);
    this.#order = order;
    this.#pos = pos;
    this.#count = count;
  }

  get order() {
    return this.#order;
  }
  get pos() {
    return this.#pos;
  }
  get count() {
    return this.#count;
  }
}

export class BangNoticeEvent extends CustomEvent {
  static EVENT_NAME = "bang_notice";
  #order;
  #x;
  #y;
  #anger = 100;

  constructor(data) {
    super(BangNoticeEvent.EVENT_NAME);
    this.#order = data.order;
    this.#x = data.x;
    this.#y = data.y;
  }

  get order() {
    return this.#order;
  }
  get x() {
    return this.#x;
  }
  get y() {
    return this.#y;
  }
  get anger() {
    return this.#anger;
  }
}

export class BangFailEvent extends CustomEvent {
  static EVENT_NAME = "bang_fail";
  #order;

  constructor(order) {
    super(BangFailEvent.EVENT_NAME);
    this.#order = order;
  }

  get order() {
    return this.#order;
  }
}

export class BangPreviewEvent extends CustomEvent {
  static EVENT_NAME = "bang_preview";
  #order;
  #impact;

  constructor(data) {
    super(BangPreviewEvent.EVENT_NAME);
    this.#order = data.order;
    this.#impact = data.impact;
  }

  get order() {
    return this.#order;
  }

  get impact() {
    return this.#impact;
  }
}

export class BangSuccessEvent extends CustomEvent {
  static EVENT_NAME = "bang_success";
  #order;
  #pos;
  #impact;

  constructor(data) {
    super(BangSuccessEvent.EVENT_NAME);
    this.#order = data.order;
    this.#pos = data.pos;
    this.#impact = data.impact || null;
  }

  get order() {
    return this.#order;
  }
  get pos() {
    return this.#pos;
  }

  get impact() {
    return this.#impact;
  }
}

export class PutPassEvent extends CustomEvent {
  static EVENT_NAME = "put_pass";
  #order;
  #fromRemote;

  constructor(order, fromRemote = false) {
    super(PutPassEvent.EVENT_NAME);
    this.#order = order;
    this.#fromRemote = fromRemote;
  }

  get order() {
    return this.#order;
  }
  get fromRemote() {
    return this.#fromRemote;
  }
}

export class TakeCornerEvent extends CustomEvent {
  static EVENT_NAME = "take_corner";
  #order;
  #corner;

  constructor(order, corner) {
    super(TakeCornerEvent.EVENT_NAME);
    this.#order = order;
    this.#corner = corner;
  }

  get order() {
    return this.#order;
  }
  get corner() {
    return this.#corner;
  }
}

export class UpdateCompleteEvent extends CustomEvent {
  static EVENT_NAME = "updated";
  constructor() {
    super(UpdateCompleteEvent.EVENT_NAME);
  }
}
