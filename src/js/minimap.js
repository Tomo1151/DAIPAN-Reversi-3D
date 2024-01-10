import { Disk } from "./object.js";
import * as Event from "./event.js";

export default class Minimap {
	#game_manager;
	#renderer_manager;
	#dom_manager;
	#wrapper;
	#container_dom;
	#dom;
	#table;
	#controller;
	#visibility;
	#active;

	constructor (game_manager, renderer_manager, dom_manager) {
		this.#game_manager = game_manager;
		this.#renderer_manager = renderer_manager;
		this.#dom_manager = dom_manager;
		this.#wrapper = document.querySelector('.minimap-wrapper');
		this.#container_dom = document.getElementById('minimap_table');
		this.#dom = document.getElementById('minimap_body');
		this.#visibility = false;

		this.#controller = new AbortController();

		this.#container_dom.addEventListener('click', (e) => {
			if (!this.#active) return;
			let rect = this.#container_dom.getBoundingClientRect();
			console.log(`X: ${parseInt(e.clientX - rect.left)}/${this.#container_dom.clientWidth}, Y: ${parseInt(e.clientY - rect.top)}/${this.#container_dom.clientHeight}`)
			// console.dir(e.target)
			let int_x = parseInt(e.clientX - rect.left);
			let int_y = parseInt(e.clientY - rect.top);
			let pos_x = (int_x / this.#container_dom.clientWidth) * 800;
			let pos_y = (int_y / this.#container_dom.clientHeight) * 800;

			const data = {
				"order": Disk.WHITE,
				"x": pos_x,
				"y": pos_y
			}

			this.#game_manager.dispatchEvent(new Event.BangNoticeEvent(data));

		}, { signal: this.#controller.signal })
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
		this.#visibility = true;
	}

	hide() {
		this.#container_dom.style.display = 'none';
		this.#visibility = false;
	}

	activate() {
		const v = this.#visibility;
		this.show();
		this.#visibility = v;

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

		this.#active = true;

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
		this.#active = false;

		if (this.#visibility) {
			this.show();
		} else {
			this.hide();
		}
	}

	toggle() {
		if (this.#visibility) {
			this.hide();
		} else {
			this.show();
		}
	}

	toggle_activate() {
		if (this.#active) {
			this.deactivate();
		} else {
			this.activate();
		}
	}
}