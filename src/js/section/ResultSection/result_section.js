import * as THREE from "three";
import { model_load } from "../../utils.js";
import { Disk, Board } from "../../object.js";
import Section from "../section.js";
import * as Event from "../../event.js";

export default class ResultSection extends Section {
	#result;
	#rot = 0;
	#target_pos = {
		"x": 0,
		"y": 50,
		"z": 100
	};
	#is_moved = false;

	constructor(game_manager, renderer_manager, scene, result) {
		super(game_manager, renderer_manager, scene);
		this.#result = result;
		// this.renderer_manager.camera.position.set(100, 50, 100);

		console.log("\n-- RESULT SECTION --");

	}

	run() {
		if (this.#is_moved){
			let rad = this.#rot++ * Math.PI / 180 / 20;
			this.renderer_manager.camera.position.x = 100 * Math.sin(rad);
			this.renderer_manager.camera.position.z = 100 * Math.cos(rad);
			this.renderer_manager.camera.lookAt(0, 0, 0);
		} else {
			let dx = this.#target_pos.x - this.renderer_manager.camera.position.x;
			let dy = this.#target_pos.y - this.renderer_manager.camera.position.y;
			let dz = this.#target_pos.z - this.renderer_manager.camera.position.z;
			// console.log(`camera: ${this.renderer_manager.camera.position.x}, ${this.renderer_manager.camera.position.y}, ${this.renderer_manager.camera.position.z}`)
			// console.log(`diff: ${dx}, ${dy}, ${dz}`)
			this.renderer_manager.camera.position.x += dx / 100;
			this.renderer_manager.camera.position.y += dy / 100;
			this.renderer_manager.camera.position.z += dz / 100;
			this.renderer_manager.camera.lookAt(0, 0, 0);

			if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(dz) < 0.5) {
				this.renderer_manager.camera.position.set(0, 50, 100);
				// console.log(`set: ${this.renderer_manager.camera.position.x}, ${this.renderer_manager.camera.position.y}, ${this.renderer_manager.camera.position.z}`)
				this.#is_moved = true;
			}
		}
	}
	init() {
		this.renderer_manager.controls.enabled = false;
	}
}