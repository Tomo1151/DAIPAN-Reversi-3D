import * as THREE from "three";
import { Disk, Board } from "../../Object.js";
import Section from "../Section.js";
import * as Event from "../../Event.js";

export default class ResultSection extends Section {
	#result;
	#rot = 0;
	#hasMoveCompleted;

	constructor(gameManager, rendererManager, cameraManager, scene, result) {
		super(gameManager, rendererManager, cameraManager, scene);
		this.#result = result;
		this.#hasMoveCompleted = false;

		this.logger.log("\n-- RESULT SECTION --");
		// console.log("\n-- RESULT SECTION --");

	}

	run() {
		if (!this.#hasMoveCompleted) return;
		let rad = this.#rot++ * Math.PI / 180 / 20;
		this.rendererManager.camera.position.x = 100 * Math.sin(rad);
		this.rendererManager.camera.position.z = 100 * Math.cos(rad);
		this.rendererManager.camera.lookAt(0, 0, 0);
	}

	init() {
		this.cameraManager.moveTo(0, 50, 100, new THREE.Vector3(0, 0, 0), false, () => {this.#hasMoveCompleted = true;})
	}
}