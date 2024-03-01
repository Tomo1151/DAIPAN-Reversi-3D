export default class Section {
	#gameManager;
	#rendererManager;
	#cameraManager;
	#logger;
	#scene;
	#canvas;

	constructor(gameManager, rendererManager, cameraManager, scene) {
		this.#gameManager = gameManager;
		this.#rendererManager = rendererManager;
		this.#cameraManager = cameraManager;
		this.#logger = this.#gameManager.logger;
		this.#scene = scene;
		this.#canvas = document.getElementById('main-canvas');

	}

	run() {}
	init() {}

	get scene() {return this.#scene;}
	get gameManager() {return this.#gameManager;}
	get rendererManager() {return this.#rendererManager;}
	get cameraManager() {return this.#cameraManager;}
	get logger() {return this.#logger;}
	get canvas() {return this.#canvas}
}