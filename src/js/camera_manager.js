import * as THREE from "three";

export default class CameraManager extends THREE.EventDispatcher {
	#game_manager;
	#renderer_manager;
	#scene;
	#camera;
	#hasMoveCompleted = true;
	#target;

	constructor(game_manager, renderer_manager, scene) {
		super();
		this.#game_manager = game_manager;
		this.#renderer_manager = renderer_manager;
		this.#scene = scene;
		this.#camera = renderer_manager.camera;
	}

	update() {
		if (this.#target) this.move();
		// console.log("camera update");
	}

	moveTo(x, y, z, lookAt, controlable, callback) {
		this.#target = {
			"x": x,
			"y": y,
			"z": z,
			"lookAt": lookAt,
			"controlable": controlable,
			"callback": callback
		};
		console.log("Set: ");
		console.dir(this.#target);
	}

	move() {
		this.#hasMoveCompleted = false;
		this.changeControlable(this.#target.controlable);

		let dx = this.#target.x - this.#camera.position.x;
		let dy = this.#target.y - this.#camera.position.y;
		let dz = this.#target.z - this.#camera.position.z;
		// console.log(`camera: ${this.renderer_manager.camera.position.x}, ${this.renderer_manager.camera.position.y}, ${this.renderer_manager.camera.position.z}`)
		// console.log(`diff: ${dx}, ${dy}, ${dz}`)
		this.#camera.position.x += dx / 50;
		this.#camera.position.y += dy / 50;
		this.#camera.position.z += dz / 50;
		this.#camera.lookAt(this.#target.lookAt.x, this.#target.lookAt.y, this.#target.lookAt.z);

		if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05 && Math.abs(dz) < 0.05) {
			this.#camera.position.set(this.#target.x, this.#target.y, this.#target.z);
			// console.log(`set: ${this.renderer_manager.camera.position.x}, ${this.renderer_manager.camera.position.y}, ${this.renderer_manager.camera.position.z}`)
			this.#hasMoveCompleted = true;
			this.#target.callback();
			this.#target = undefined;
		}
	}

	changeControlable(bool){
		this.#renderer_manager.controls.enabled = bool;
	}
}