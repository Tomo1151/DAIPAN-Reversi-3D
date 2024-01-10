import * as THREE from "three";
import { is_empty } from "./utils.js";

export default class CameraManager extends THREE.EventDispatcher {
	#game_manager;
	#renderer_manager;
	#scene;
	#camera;
	#hasMoveCompleted;
	#target;
	#original_position;
	// #original_rotation;

	constructor(game_manager, renderer_manager, scene) {
		super();
		this.#game_manager = game_manager;
		this.#renderer_manager = renderer_manager;
		this.#scene = scene;
		this.#camera = renderer_manager.camera;
		this.#hasMoveCompleted = true;
		this.#target = undefined
		this.#original_position = undefined;
	}

	update() {
		// console.log(this)
		if (!this.#hasMoveCompleted) this.move();
		// console.log(this)
	}

	moveTo(x, y, z, lookAt, controlable, callback, step) {
		// console.log(this);
		// if (is_empty(this.#original_position)) {
			this.#original_position = JSON.parse(JSON.stringify(this.#camera.position));
			// this.#original_rotation = this.#camera.rotation;
		// }

		// console.log(this.#original_position)
		console.log("***")
		// console.log(this)
		this.target = structuredClone({x, y, z, lookAt, controlable, step});
		// console.log(this)
		console.log("***")
		this.#hasMoveCompleted = false;

	}

	move() {
		this.controlable = this.#target.controlable;

		let dx = this.#target.x - this.#camera.position.x;
		let dy = this.#target.y - this.#camera.position.y;
		let dz = this.#target.z - this.#camera.position.z;
		let step = this.#target.step ? this.#target.step : 50

		this.#camera.position.x += dx / step;
		this.#camera.position.y += dy / step;
		this.#camera.position.z += dz / step;
		this.#camera.lookAt(this.#target.lookAt.x, this.#target.lookAt.y, this.#target.lookAt.z);

		console.log(`dx: ${dx}, dy: ${dy}, dz: ${dz}`)

		if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05 && Math.abs(dz) < 0.05) {
			this.#camera.position.set(this.#target.x, this.#target.y, this.#target.z);
			this.#hasMoveCompleted = true;
			if(!is_empty(this.#target.callback)) this.#target.callback();
			this.#target = undefined;
		}
	}

	restore() {
		let pos = this.#original_position;
		// let rot = this.#original_rotation;
		console.log("------------")
		this.moveTo(pos.x, pos.y, pos.z, new THREE.Vector3(0, 0, 0), false, () => {this.controlable = true;}, 10);
		// this.#original_position = undefined;
		// this.#original_rotation = undefined;
	}

	set controlable(bool){
		this.#renderer_manager.controls.enabled = bool;
	}

	set target(target) {this.#target = target;}
}