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
		// this.drawResultScreen();
	}
}