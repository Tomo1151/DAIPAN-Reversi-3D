import * as THREE from "three";

export default class CameraManager {
	#gameManager;
	#rendererManager;
	#scene;
	#camera;
	#hasMoveCompleted = true;
	#target;
	#originalPosition;

	constructor(gameManager, rendererManager, scene) {
		this.#gameManager = gameManager;
		this.#rendererManager = rendererManager;
		this.#scene = scene;
		this.#camera = rendererManager.camera;
	}

	update() {
		if (!this.#hasMoveCompleted) this.move();
	}

	moveTo(x, y, z, lookAt, controlable, callback, step) {
		console.log(` |~ camera: move to (${x}, ${y}, ${z})`);
		this.#originalPosition = JSON.parse(JSON.stringify(this.#camera.position));
		this.#target = {x, y, z, lookAt, controlable, callback, step};
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


		if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05 && Math.abs(dz) < 0.05) {
			this.#camera.position.set(this.#target.x, this.#target.y, this.#target.z);
			this.#hasMoveCompleted = true;
			if (this.#target.callback) this.#target.callback();
			console.log(` |~ camera: moved to (${this.#target.x}, ${this.#target.y}, ${this.#target.z})`);
			this.#target = undefined;
		}
	}

	restore() {
		let pos = this.#originalPosition;
		this.moveTo(pos.x, pos.y, pos.z, new THREE.Vector3(0, 0, 0), true, () => {this.controlable = true;}, 10);
	}

	set controlable(bool) {this.#rendererManager.controls.enabled = bool;}
}