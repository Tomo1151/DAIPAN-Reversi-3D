import { Disk } from "./object.js";

export default class Minimap {
	#game_manager;
	#renderer_manager;
	#dom_manager;
	#wrapper;
	#container_dom;
	#dom;
	#table;
	#controller;

	constructor (game_manager, renderer_manager, dom_manager) {
		this.#game_manager = game_manager;
		this.#renderer_manager = renderer_manager;
		this.#dom_manager = dom_manager;
		this.#wrapper = document.querySelector('.minimap-wrapper');
		this.#container_dom = document.getElementById('minimap_table');
		this.#dom = document.getElementById('minimap_body');

		this.#controller = new AbortController();
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

	show() {
		this.#container_dom.style.display = 'table';
	}

	hide() {
		this.#container_dom.style.display = 'none';
	}

	activate() {
		this.show();
		this.#wrapper.style.width = '80vh';
		this.#wrapper.style.height = '80vh';

		this.#container_dom.style.width = '100%';
		this.#container_dom.style.height = '100%';
		this.#container_dom.style.fontSize = '.1rem';

		this.#wrapper.style.top = '50%';
		this.#wrapper.style.left = '50%';
		this.#wrapper.style.transform = 'translate(-50%, -50%)';
		this.#wrapper.style.opacity = '.95';
		this.#wrapper.style.pointerEvents = 'all';

		this.#container_dom.addEventListener('click', (e) => {
			let rect = this.#container_dom.getBoundingClientRect();
			console.log(`X: ${parseInt(e.clientX - rect.left)}/${this.#container_dom.clientWidth}, Y: ${parseInt(e.clientY - rect.top)}/${this.#container_dom.clientHeight}`)
			// console.dir(e.target)
		}, { signal: this.#controller.signal })

		// for (let i = 0; i < 8; i++) {
		// 	for (let j = 0; j < 8; j++) {
		// 		let cell = this.#dom.children[i+1].children[j];
		// 		cell.addEventListener('mouseover', () => {cell.style.backgroundColor = 'red'});
		// 		cell.addEventListener('mouseout', () => {cell.style.backgroundColor = 'var(--color-bg-board)'});
		// 	}
		// }
	}

	deactivate() {
		this.#wrapper.style.width = '';
		this.#wrapper.style.height = '';
		this.#wrapper.style.inset = '';
		this.#wrapper.style.transform = '';
		this.#wrapper.style.opacity = '0.8';
		this.#wrapper.style.pointerEvents = 'none';

		this.#controller.abort();
	}
}