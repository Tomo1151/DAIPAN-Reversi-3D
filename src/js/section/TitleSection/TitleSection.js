import * as THREE from "three";
import Section from "../Section.js";
import { sleep } from "../../Utils.js";

export default class TitleSection extends Section {
	#rot = 0;

	constructor(gameManager, rendererManager, cameraManager, scene) {
		super(gameManager, rendererManager, cameraManager, scene);
		this.rendererManager.controls.enabled = false;
		// this.scene.add(new THREE.AxesHelper(500))
		console.log("-- TITLE SECTION --");console.log();
	}

	run() {
		let rad = this.#rot++ * Math.PI / 180 / 20;
		this.rendererManager.camera.position.x = 100 * Math.sin(rad);
		this.rendererManager.camera.position.z = 100 * Math.cos(rad);
		this.rendererManager.camera.lookAt(0, 0, 0);
	}

	init() {
		const ambientLight = new THREE.AmbientLight(0xffffff, 1.75);
		const directionalLight0 = new THREE.DirectionalLight(0xffffff, 1);
		const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
		const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
		const directionalLight3 = new THREE.DirectionalLight(0xffffff, 1);
		const lights = [directionalLight0, directionalLight1, directionalLight2, directionalLight3];
		directionalLight0.position.set(25, 25, 25);
		directionalLight1.position.set(25, 25, -25);
		directionalLight2.position.set(-25, 25, 25);
		directionalLight3.position.set(-25, 25, -25);
		for (let light of lights) {
			light.intensity = 0.75;
			this.scene.add(light);
		}

		const boardModel = this.gameManager.objects.board.scene.clone();
		boardModel.scale.set(5.05, 5.05, 5.05);
		boardModel.position.set(0, 0.5, 0);
		this.scene.add(boardModel);
	}

	get rot() {return this.#rot;}
}