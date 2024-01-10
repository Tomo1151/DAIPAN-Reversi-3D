import * as THREE from "three";
import { model_load } from "../../utils.js";
import { Disk, Board } from "../../object.js";
import Section from "../section.js";
import * as Event from "../../event.js";

export default class ResultSection extends Section {
	#result;
	#rot = 0;
	#hasMoveCompleted;

	constructor(game_manager, renderer_manager, camera_manager, scene, result) {
		super(game_manager, renderer_manager, camera_manager, scene);
		this.#result = result;
		this.#hasMoveCompleted = false;

		console.log("\n-- RESULT SECTION --");

	}

	run() {
		if (!this.#hasMoveCompleted) return;
		let rad = this.#rot++ * Math.PI / 180 / 20;
		this.renderer_manager.camera.position.x = 100 * Math.sin(rad);
		this.renderer_manager.camera.position.z = 100 * Math.cos(rad);
		this.renderer_manager.camera.lookAt(0, 0, 0);
	}

	init() {
		this.camera_manager.moveTo(0, 50, 100, new THREE.Vector3(0, 0, 0), false, () => {this.#hasMoveCompleted = true;})
	}
}