export default class Minimap {
	#game_manager;
	#renderer_manager;
	#dom_manager;

	#table;

	constructor (game_manager, renderer_manager, dom_manager, table) {
		this.#game_manager = game_manager;
		this.#renderer_manager = renderer_manager;
		this.#dom_manager = dom_manager;
		this.table = table;
	}

	
	update() {}
}