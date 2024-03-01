export default class SectionManager {
	static TITLE = 0;
	static SELECT = 1;
	static PLAYING = 2;
	static RESULT = 3;

	#gameManager;
	#rendererManager;
	#scene;

	constructor(gameManager, rendererManager, scene) {
		this.#gameManager = gameManager;
		this.#rendererManager = rendererManager;
		this.#scene = scene;
	}

	reset_scene() {}

	changeSection(section) {
		this.reset_scene();
		section.init()
	}

	set scene(scene) {this.#scene = scene;}
	set rendererManager(rendererManager) {this.#rendererManager = rendererManager;}
}