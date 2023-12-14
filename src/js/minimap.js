import { Disk } from "./object.js";

export default class Minimap {
	#game_manager;
	#renderer_manager;
	#dom_manager;
	#wrapper;
	#container_dom;
	#dom;
	#table;

	constructor (game_manager, renderer_manager, dom_manager) {
		this.#game_manager = game_manager;
		this.#renderer_manager = renderer_manager;
		this.#dom_manager = dom_manager;
		this.#wrapper = document.querySelector('.minimap-wrapper');
		this.#container_dom = document.getElementById('minimap_table');
		this.#dom = document.getElementById('minimap_body');
	}

	
	update(table) {
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				// console.dir(this.#dom.children[i+1].children[j]);
				let symbol = (table[i*8+j].state == Disk.EMPTY) ? '' : '⬤';
				let cell = this.#dom.children[i+1].children[j];
				cell.style.color = (table[i*8+j].state == Disk.BLACK) ? 'black' : 'white';
				cell.innerText = symbol;
			}
		}
	}

	scaleUp() {
		this.#container_dom.style.display = 'table';
		this.#container_dom.width = '500px'
	}

}