class SectionManager {
	static TITLE = 0;
	static SELECT = 1;
	static PLAYING = 2;
	static RESULT = 3;

	#game_manager;
	#renderer_manager;
	#scene;

	constructor(game_manager, renderer_manager, scene) {
		this.#game_manager = game_manager;
		this.#renderer_manager = renderer_manager;
		this.#scene = scene;
	}

	reset_scene() {}

	change_section(section) {
		this.reset_scene();
		section.init()
	}

	set scene(scene) {this.#scene = scene;}
	set renderer_manager(renderer_manager) {this.#renderer_manager = renderer_manager;}
}