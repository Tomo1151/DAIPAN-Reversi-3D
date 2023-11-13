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
}