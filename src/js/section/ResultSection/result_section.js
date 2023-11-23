import * as THREE from "three";
import { model_load } from "../../utils.js";
import { Disk, Board } from "../../object.js";
import Section from "../section.js";
import * as Event from "../../event.js";

export default class ResultSection extends Section {
	#result;
	#rot = 0;

	constructor(game_manager, renderer_manager, scene, result) {
		super(game_manager, renderer_manager, scene);
		this.#result = result;
		this.renderer_manager.camera.position.set(100, 50, 100);

		console.log("\n-- RESULT SECTION --");

	}

	run() {
		let rad = this.#rot++ * Math.PI / 180 / 20;
		this.renderer_manager.camera.position.x = 100 * Math.sin(rad);
		this.renderer_manager.camera.position.z = 100 * Math.cos(rad);
		this.renderer_manager.camera.lookAt(0, 0, 0);
	}
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