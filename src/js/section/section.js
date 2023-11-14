export default class Section {
	#game_manager;
	#renderer_manager;
	#scene;

	constructor(game_manager, renderer_manager, scene) {
		this.#game_manager = game_manager;
		this.#renderer_manager = renderer_manager;
		this.#scene = scene;
	}

	run() {}
	init() {}

	get scene() {return this.#scene;}
	get game_manager() {return this.#game_manager;}
	get renderer_manager() {return this.#renderer_manager;}
}