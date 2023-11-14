import * as THREE from "three";
import { model_load } from "../../utils.js";
// import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { Disk, Board } from "../../object.js"
import Section from "../section.js";

export default class GameSection extends Section {
	#selected_hitbox;
	#hitboxes = [];
	#disk_meshes = [];
	#intersects = [];
	#selected_color = new THREE.Color(0xff0000);
	#hitboxe_color = new THREE.Color(0x000000);
	#canvas;

	constructor(game_manager, renderer_manager, scene) {
		super(game_manager, renderer_manager, scene);
		this.#canvas = document.getElementById('main-canvas');
	}

	run() {
	}

	init() {
		const ambient_light = new THREE.AmbientLight(0xffffff, 1);
		const directional_light = new THREE.DirectionalLight(0xffffff, 1);
		directional_light.intensity = 1;
		directional_light.position.set(0, 0, 40);

		this.scene.add(new THREE.AxesHelper(500));
		this.scene.add(ambient_light)
		this.scene.add(directional_light);

		model_load('model_data/Board_low.gltf', (obj) => {
			obj.scene.scale.set(5, 5, 5);
			obj.scene.position.set(0, 0.5, 0);
			for (let i = 0; i < 8; i++) {
				for (let j = 0; j < 8; j++) {
					const g = new THREE.BoxGeometry(9.99, 1.15, 9.99);
					const m = new THREE.MeshStandardMaterial({
						color:0x000000,
						opacity: 0.5,
						transparent: true
					});

					const box = new THREE.Mesh(g, m);
					box.position.set(10*j - (10*3+5), 0, 10*i - (10*3+5));
					box.cell_x = j;
					box.cell_y = i;
					box.is_mousedown = false;

					this.#hitboxes.push(box);
					this.scene.add(box);
				}
			}
			this.scene.add(obj.scene);
		});

		model_load('model_data/Disk_low.gltf', (obj) => {
			let disk;
			for (let i = 0; i < 8; i++) {
				for (let j = 0; j < 8; j++) {
					disk = obj.scene.clone();
					disk.scale.set(4, 4, 4);
					disk.position.set(10*j - (10*3+5), 1, 10*i - (10*3+5));
					disk.visible = false;

					this.#disk_meshes.push(disk);
					this.scene.add(disk);
				}
			}
		});

		window.addEventListener('mousemove', (e) => {
			this.renderer_manager.setCursorPoint(e);
			this.renderer_manager.raycaster.setFromCamera(this.renderer_manager.mouse, this.renderer_manager.camera);
			// console.log(this.#hitboxes)
			let intersects = this.renderer_manager.raycaster.intersectObjects(this.#hitboxes);
			if (intersects.length > 0) {
				for (let hitbox of this.#hitboxes) {
					if (hitbox == intersects[0].object) {
						hitbox.material.color = this.#selected_color;
						this.#selected_hitbox = hitbox;
					} else {
						hitbox.material.color = this.#hitboxe_color;
					}

				}
			} else {
				this.#selected_hitbox = undefined;
			}
		});

		this.#canvas.addEventListener('mousedown', () => {
			let box = this.#selected_hitbox;
			this.#canvas.addEventListener('mouseup', (e) => {
				if (this.#selected_hitbox == box && box != undefined) {
					let order = Disk.WHITE;
					let x = this.#selected_hitbox.cell_x
					let y = this.#selected_hitbox.cell_y
					// console.log(`x: ${x}, y: ${y}`);
					let data = {
						"order": order,
						"x": x,
						"y": y
					};

					console.log(data)
					this.#selected_hitbox = undefined;

					// const e = new PutNoticeEvent(data);
					// gm.dispatchEvent(e);
				}
			});
		});
	}

	disk_mesh_update(table) {
		for (let i = 0; i < table.length; i++) {
			switch (table[i].state) {
				case Disk.WHITE:
					this.#disk_meshes[i].rotation.z = 0;
					this.#disk_meshes[i].visible = true;
					break;
				case Disk.BLACK:
					this.#disk_meshes[i].rotation.z = Math.PI;
					this.#disk_meshes[i].visible = true;
					break;
			}
		}
	}
}