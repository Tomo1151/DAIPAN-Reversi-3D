import * as THREE from "three";
import Section from "../Section.js";
import { sleep, model_load } from "../../Utils.js";

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
		const ambient_light = new THREE.AmbientLight(0xffffff, 1.75);
		const directional_light0 = new THREE.DirectionalLight(0xffffff, 1);
		const directional_light1 = new THREE.DirectionalLight(0xffffff, 1);
		const directional_light2 = new THREE.DirectionalLight(0xffffff, 1);
		const directional_light3 = new THREE.DirectionalLight(0xffffff, 1);
		const lights = [directional_light0, directional_light1, directional_light2, directional_light3];
		directional_light0.position.set(25, 25, -25);
		directional_light1.position.set(-25, 25, -25);
		directional_light2.position.set(-25, 25, 25);
		directional_light3.position.set(-25, 25, -25);
		for (let light of lights) {
			light.intensity = 0.75;
			this.scene.add(light);
		}

		const board_model = this.gameManager.objects.board.scene.clone();
		board_model.scale.set(5.05, 5.05, 5.05);
		board_model.position.set(0, 0.5, 0);
		this.scene.add(board_model);
	}

	get rot() {return this.#rot;}
}