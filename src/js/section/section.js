export default class Section {
	#game_manager;
	#renderer_manager;
	#camera_manager;
	#scene;
	#canvas;

	constructor(game_manager, renderer_manager, camera_manager, scene) {
		this.#game_manager = game_manager;
		this.#renderer_manager = renderer_manager;
		this.#camera_manager = camera_manager;
		this.#scene = scene;
		this.#canvas = document.getElementById('main-canvas');

	}

	run() {}
	init() {}

	get scene() {return this.#scene;}
	get game_manager() {return this.#game_manager;}
	get renderer_manager() {return this.#renderer_manager;}
	get camera_manager() {return this.#camera_manager;}
	get canvas() {return this.#canvas}
}