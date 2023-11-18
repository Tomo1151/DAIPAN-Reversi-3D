import * as THREE from "three";
import { model_load } from "../../utils.js";
import { Disk, Board } from "../../object.js";
import Section from "../section.js";
import * as Event from "../../event.js";

export default class ResultSection extends Section {
	#result;
	constructor(game_manager, renderer_manager, scene, result) {
		super(game_manager, renderer_manager, scene);
		this.#result = result;
	}

	run() {}
	init() {
		this.renderer_manager.controls.enabled = false;
		this.drawResultScreen();
	}

	drawResultScreen() {
		let container = document.getElementById('result_screen');
		let dom_score = document.getElementById('score');
		let dom_order_black = document.getElementById('order_black');
		let dom_order_white = document.getElementById('order_white');

		container.style.display = 'block';

		console.log(this.#result);

		dom_order_white.innerText = this.#result.white;
		dom_order_black.innerText = this.#result.black;
		dom_score.innerText = -1;
	}
}