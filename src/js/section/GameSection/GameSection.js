import * as THREE from "three";

import GameManager from "../../GameManager.js";
import { model_load, sleep } from "../../Utils.js";
import { Disk, Board } from "../../Object.js";
import Section from "../Section.js";
import * as Event from "../../Event.js";

export default class GameSection extends Section {
	static MODE_NONE = -1;
	static MODE_PUT = 0;
	static MODE_BANG = 1;

	#current_table = new Array(8*8);

	#is_selectable = false;
	#selected_hitbox;
	#hitboxes = [];
	#base;
	#on_base;
	#select_area;
	#disk_models = [];
	#disk_animations = [];
	#animation_mixers = [];
	#intersects = [];
	#selected_color = new THREE.Color(0xff0000);
	#hitboxe_color = new THREE.Color(0xffffff);
	#mode = GameSection.MODE_NONE;
	#player_act;
	#pos_diff;
	#clock;

	constructor(gameManager, rendererManager, cameraManager, scene) {
		super(gameManager, rendererManager, cameraManager, scene);
		this.rendererManager.controls.enabled = true;
		this.#clock = new THREE.Clock();

		const click_controller = new AbortController();
		const mousemove_controller = new AbortController();

		for (let i = 0; i < 8*8; i++) this.#current_table[i] = Disk.EMPTY;

		console.log("-- GAME SECTION --");
		window.addEventListener('mousemove', (e) => {
			if (this.gameManager.player.order != this.gameManager.currentTurn || !this.#is_selectable) return;
			this.rendererManager.setCursorPoint(e);
			this.rendererManager.raycaster.setFromCamera(this.rendererManager.mouse, this.rendererManager.camera);

			switch (this.#mode) {
				case GameSection.MODE_PUT:
					let intersects = this.rendererManager.raycaster.intersectObjects(this.#hitboxes);
					if (intersects.length > 0) {
						for (let hitbox of this.#hitboxes) {
							if (hitbox == intersects[0].object) {
								hitbox.visible = true;
								this.#selected_hitbox = hitbox;
							} else {
								hitbox.visible = false;
							}
						}
					} else {
						this.#selected_hitbox = undefined;
					}

					break;
				case GameSection.MODE_BANG:
					for (let hitbox of this.#hitboxes) hitbox.visible = false;

					let intersect = this.rendererManager.raycaster.intersectObject(this.#base)[0]
					if (intersect) {
						this.#on_base = true;
						this.#select_area.visible = true;
						this.#select_area.position.x = intersect.point.x
						this.#select_area.position.z = intersect.point.z
					} else {
						this.#on_base = false;
						this.#select_area.visible = false;
					}

					break;
				default:
					break;
			}
		}, {signal: mousemove_controller.signal});

		this.canvas.addEventListener('mousedown', () => {
			switch(this.#mode) {
				case GameSection.MODE_PUT:
					let box = this.#selected_hitbox;
					this.canvas.addEventListener('mouseup', (e) => {
						if (this.#selected_hitbox == box && box != undefined) {
							let x = this.#selected_hitbox.cell_x
							let y = this.#selected_hitbox.cell_y
							this.#selected_hitbox = undefined;
							this.gameManager.dispatchEvent(new Event.PutNoticeEvent({"order": Disk.WHITE, "x": x, "y": y}));
						}
					}, {signal: click_controller.signal});

					break;
				case GameSection.MODE_BANG:
					let pos = this.#select_area.position;
					if (this.#on_base) {
						this.#select_area.visible = false;
						this.gameManager.dispatchEvent(new Event.BangNoticeEvent({"order": Disk.WHITE, "x": pos.x*10+400, "y": pos.z*10+400}));
						this.cameraManager.restore();
					}

					break;
				default:
					break;
			}
		}, {signal: click_controller.signal});

		this.gameManager.addEventListener('turn_notice', (e) => {
			if (this.gameManager.player.order == e.order) this.#is_selectable = true;
		});

		this.gameManager.addEventListener('put_pass', (e) => {
			if (this.gameManager.player.order != e.order) return;
			for (let hitbox of this.#hitboxes) hitbox.visible = false;
			this.#is_selectable = false;
			this.#player_act = 'pass';
		});

		this.gameManager.addEventListener('put_success', (e) => {
			if (this.gameManager.player.order == e.order) {
				for (let hitbox of this.#hitboxes) hitbox.visible = false;
				this.#is_selectable = false;
			}

			this.#player_act = 'put'
		});

		this.gameManager.addEventListener('bang_success', (e) => {
			this.#player_act = 'bang';
			this.#pos_diff = e.pos;
		});

		this.gameManager.addEventListener('confirmed', async () => {
			if (this.#player_act == 'bang') {
				await this.disk_mesh_flip(this.gameManager.board.table, this.#pos_diff);
			} else {
				await this.disk_mesh_update(this.gameManager.board.table);
			}
			this.gameManager.dispatchEvent(new Event.UpdateCompleteEvent());
		});

		// Listener delete
		this.gameManager.addEventListener('game_over', () => {
				console.log("delete click callback");
				click_controller.abort();
				console.log("delete mousemove callback");
				mousemove_controller.abort();
		});

	}

	run() {
		let d = this.#clock.getDelta();
		for (let mixer of this.#animation_mixers) {
			if(mixer){
				mixer.update(d);
			}
		}
	}

	async init() {
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

		this.scene.add(new THREE.AxesHelper(500));
		const cylinder = new THREE.Mesh(
			new THREE.CylinderGeometry(10, 10, 1, 30),
			new THREE.MeshPhongMaterial({color: 0xff0000, opacity: 0.5, transparent: true})
		);
		cylinder.visible = false;
		cylinder.position.set(0, 1.9, 0);
		this.#select_area = cylinder;

		const base = new THREE.Mesh(
			new THREE.PlaneGeometry(80, 80, 1, 1),
			new THREE.MeshPhongMaterial({color: 0x7f00ff, opacity: 0, transparent: true})
		);

		base.position.y = 0.6
		base.rotation.x = - Math.PI / 2
		this.#base = base;
		this.scene.add(cylinder);
		this.scene.add(base);

		this.object_set().then(async () => {
			await this.disk_mesh_update(this.gameManager.board.table);
			this.gameManager.dispatchEvent(new Event.UpdateCompleteEvent())
		});
	}

	async animation_flip(disk_num, order) {
		let disk = this.#disk_models[disk_num];
		let action = this.#animation_mixers[disk_num].clipAction(disk.animations[order]);
		let duration = disk.animations[order].duration;

		action.timeScale = 1;
		action.setLoop(THREE.LoopOnce);
		action.clampWhenFinished = true;

		console.log(` |... animation start [flip :to${order == Disk.BLACK? "B": "W"}]`);
		action.reset().play();
		await sleep(duration*1000);
		console.log(" |... animation end");
		action.stop();

		disk.scene.rotation.z += Math.PI;
		disk.scene.rotation.z %= 2 * Math.PI;
	}

	async animation_put(disk_num, order) {
		let disk = this.#disk_models[disk_num];
		let action = this.#animation_mixers[disk_num].clipAction(disk.animations[1-order + 2]);
		let duration = disk.animations[1-order + 2].duration;

		disk.scene.visible = true;
		disk.scene.rotation.z = order * Math.PI;

		action.timeScale = 5;
		action.setLoop(THREE.LoopOnce);
		action.clampWhenFinished = true;

		console.log(` |... animation start [put :${order == Disk.BLACK? "B": "W"}]`);
		action.reset().play();
		await sleep(duration*200);
		console.log(" |... animation end");
		action.stop();
	}

	async object_set() {
		return new Promise(async (res) => {
			for (let i = 0; i < 8; i++) {
				for (let j = 0; j < 8; j++) {
					const g = new THREE.BoxGeometry(10, 1.15, 10);
					const m = new THREE.MeshStandardMaterial({
						color:0xff0000,
						opacity: 0.75,
						transparent: true
					});

					const box = new THREE.Mesh(g, m);
					box.position.set(10*j - (10*3+5), 0.1, 10*i - (10*3+5));
					box.cell_x = j;
					box.cell_y = i;
					box.visible = false
					this.#hitboxes.push(box);
					this.scene.add(box);
				}
			}

			let mixer, animations;
			let obj = this.gameManager.objects.disk;
			for (let i = 0; i < 8; i++) {
				for (let j = 0; j < 8; j++) {
					let model = Object.assign({}, obj);
					let animations = model.animations;
					model.scene = obj.scene.clone();
					mixer = new THREE.AnimationMixer(model.scene);
					model.scene.scale.set(4, 4, 4);
					model.scene.position.set(10*j - (10*3+5), 1.325, 10*i - (10*3+5));
					model.scene.visible = false;
					this.#disk_models.push(model);
					this.#disk_animations.push(model.animations);
					this.#animation_mixers.push(mixer);
					this.scene.add(model.scene);
				}
			}
			res();
		});
	}

	async disk_mesh_flip(table, put_pos) {
		let duration = this.#disk_models[0].animations[2].duration;
		for (let pos of put_pos) {
			let num = pos.y*8+pos.x;
			let order = table[num].state == Disk.WHITE ? Disk.WHITE : Disk.BLACK;
			this.#current_table[num] = table[num].state;
			this.animation_flip(num, order);
		}
		await sleep(duration*400);
	}

	async disk_mesh_update(table, put_pos, rev_pos) {
		for (let i = 0; i < 8*8; i++) {
			if (this.#current_table[i] != table[i].state) {
				if (this.#current_table[i] == Disk.EMPTY) {
					this.#current_table[i] = table[i].state;
					switch (table[i].state) {
						case Disk.WHITE:
							await this.animation_put(i, Disk.WHITE);
							break;
						case Disk.BLACK:
							await this.animation_put(i, Disk.BLACK);
					}
				}
			}
		}
		for (let i = 0; i < 8*8; i++) {
			if (this.#current_table[i] != table[i].state) {
				if (this.#current_table[i] == Disk.WHITE) {
					await this.animation_flip(i, Disk.BLACK);
				} else {
					await this.animation_flip(i, Disk.WHITE);
				}
			}
			this.#current_table[i] = table[i].state;
		}
	}

	toggle_mode(mode, target = null) {
		if (mode == this.mode) {
			this.mode = GameSection.MODE_NONE;
			this.cameraManager.controlable = true;
		} else {
			this.mode = mode;
		}
		console.log(`MODE UPDATE: ${this.mode}`)
	}

	get mode() {return this.#mode;}
	set mode(mode) {this.#mode = mode;}
}