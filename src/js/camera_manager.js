import * as THREE from "three";

export default class CameraManager extends THREE.EventDispatcher {
	#game_manager;
	#renderer_manager;
	#scene;
	#camera;
	#hasMoveCompleted = true;
	#target;
	#original_position;
	// #original_rotation;

	constructor(game_manager, renderer_manager, scene) {
		super();
		this.#game_manager = game_manager;
		this.#renderer_manager = renderer_manager;
		this.#scene = scene;
		this.#camera = renderer_manager.camera;
		this.#target = undefined
		this.#original_position = undefined;
	}

	update() {
		if (this.#target) this.move();
		// console.log(this.#original_position)
	}

	moveTo(x, y, z, lookAt, controlable, callback, step) {
		if (!this.#original_position) {
			this.#original_position = JSON.parse(JSON.stringify(this.#camera.position));
			// this.#original_rotation = this.#camera.rotation;
		}

		// console.log(this.#original_position)

		this.#target = {
			"x": x,
			"y": y,
			"z": z,
			"lookAt": lookAt,
			"controlable": controlable,
			"callback": callback,
			"step": step,
		};
	}

	move() {
		this.#hasMoveCompleted = false;
		this.controlable = this.#target.controlable;

		let dx = this.#target.x - this.#camera.position.x;
		let dy = this.#target.y - this.#camera.position.y;
		let dz = this.#target.z - this.#camera.position.z;
		let step = this.#target.step ? this.#target.step : 50

		this.#camera.position.x += dx / step;
		this.#camera.position.y += dy / step;
		this.#camera.position.z += dz / step;
		this.#camera.lookAt(this.#target.lookAt.x, this.#target.lookAt.y, this.#target.lookAt.z);

		if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05 && Math.abs(dz) < 0.05) {
			this.#camera.position.set(this.#target.x, this.#target.y, this.#target.z);
			this.#hasMoveCompleted = true;
			if(this.#target.callback) this.#target.callback();
			this.#target = undefined;
		}
	}

	restore() {
		let pos = this.#original_position;
		// let rot = this.#original_rotation;
		this.moveTo(pos.x, pos.y, pos.z, new THREE.Vector3(0, 0, 0), false, () => {this.controlable = true;}, 10);
		this.#original_position = undefined;
		// this.#original_rotation = undefined;
	}

	set controlable(bool){
		this.#renderer_manager.controls.enabled = bool;
	}
}