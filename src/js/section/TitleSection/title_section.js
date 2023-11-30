import * as THREE from "three";
import Section from "../section.js";
import { sleep, model_load } from "../../utils.js";

export default class TitleSection extends Section {
	#rot = 0;

	constructor(game_manager, renderer_manager, scene) {
		super(game_manager, renderer_manager, scene);
		this.renderer_manager.controls.enabled = false;
		// this.scene.add(new THREE.AxesHelper(500))
		console.log("-- TITLE SECTION --");console.log();
	}

	run() {
		let rad = this.#rot++ * Math.PI / 180 / 20;
		this.renderer_manager.camera.position.x = 100 * Math.sin(rad);
		this.renderer_manager.camera.position.z = 100 * Math.cos(rad);
		this.renderer_manager.camera.lookAt(0, 0, 0);
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

		model_load('model_data/Board_low.gltf', (obj) => {
			obj.scene.scale.set(5.05, 5.05, 5.05);
			obj.scene.position.set(0, 0.5, 0);

			this.scene.add(obj.scene);
		});

		model_load('model_data/Disk_low.gltf', (obj) => {
			let disk;
			for (let i = 0; i < 8; i++) {
				for (let j = 0; j < 8; j++) {
					disk = obj.scene.clone();
					disk.scale.set(4, 4, 4);
					disk.position.set(10*j - (10*3+5), 1.325, 10*i - (10*3+5));
					disk.visible = false;

					this.scene.add(disk);
				}
			}
		});
	}

	get rot() {return this.#rot;}
}