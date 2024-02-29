import * as THREE from "three";

import GameManager from "../../GameManager.js";
import { sleep } from "../../Utils.js";
import { Disk, Board } from "../../Object.js";
import Section from "../Section.js";
import * as Event from "../../Event.js";

export default class GameSection extends Section {
	static MODE_NONE = -1;
	static MODE_PUT = 0;
	static MODE_BANG = 1;

	#currentTable = new Array(8*8);

	#isSelectable = false;
	#selectedHitbox;
	#hitboxes = [];
	#base;
	#onBase;
	#selectArea;
	#diskModels = [];
	#diskAnimations = [];
	#animationMixers = [];
	#intersects = [];
	#selectedColor = new THREE.Color(0xff0000);
	#mode = GameSection.MODE_NONE;
	#playerAct;
	#posDiff;
	#clock;

	constructor(gameManager, rendererManager, cameraManager, scene) {
		super(gameManager, rendererManager, cameraManager, scene);
		this.rendererManager.controls.enabled = true;
		this.#clock = new THREE.Clock();

		const clickController = new AbortController();
		const mousemoveController = new AbortController();

		for (let i = 0; i < 8*8; i++) this.#currentTable[i] = Disk.EMPTY;

		this.logger.log("-- GAME SECTION --");
		// console.log("-- GAME SECTION --");
		const move = (e) => {
			if (e.type == "touchmove") e = e.touches[0];
			if (this.gameManager.player.order != this.gameManager.currentTurn || !this.#isSelectable) return;
			this.rendererManager.setCursorPoint(e);
			this.rendererManager.raycaster.setFromCamera(this.rendererManager.mouse, this.rendererManager.camera);

			switch (this.#mode) {
				case GameSection.MODE_PUT:
					let intersects = this.rendererManager.raycaster.intersectObjects(this.#hitboxes);
					if (intersects.length > 0) {
						for (let hitbox of this.#hitboxes) {
							if (hitbox == intersects[0].object) {
								hitbox.visible = true;
								this.#selectedHitbox = hitbox;
							} else {
								hitbox.visible = false;
							}
						}
					} else {
						this.#selectedHitbox = undefined;
					}

					break;
				case GameSection.MODE_BANG:
					for (let hitbox of this.#hitboxes) hitbox.visible = false;

					let intersect = this.rendererManager.raycaster.intersectObject(this.#base)[0]
					if (intersect) {
						this.#onBase = true;
						this.#selectArea.visible = true;
						this.#selectArea.position.x = intersect.point.x
						this.#selectArea.position.z = intersect.point.z
					} else {
						this.#onBase = false;
						this.#selectArea.visible = false;
					}

					break;
			}
		}

		window.addEventListener('mousemove', move, {signal: mousemoveController.signal});
		window.addEventListener('touchmove', move, {signal: mousemoveController.signal});

		this.canvas.addEventListener('mousedown', () => {
			switch(this.#mode) {
				case GameSection.MODE_PUT:
					let box = this.#selectedHitbox;
					this.canvas.addEventListener('mouseup', (e) => {
						if (this.#selectedHitbox == box && box != undefined) {
							let x = this.#selectedHitbox.cellX
							let y = this.#selectedHitbox.cellY
							this.#selectedHitbox = undefined;
							this.gameManager.dispatchEvent(new Event.PutNoticeEvent({"order": Disk.WHITE, "x": x, "y": y}));
						}
					}, {signal: clickController.signal});

					break;
				case GameSection.MODE_BANG:
					let pos = this.#selectArea.position;
					if (this.#onBase) {
						this.#selectArea.visible = false;
						this.gameManager.dispatchEvent(new Event.BangNoticeEvent({"order": Disk.WHITE, "x": pos.x*10+400, "y": pos.z*10+400}));
					}

					break;
			}
		}, {signal: clickController.signal});

		this.gameManager.addEventListener('turn_notice', (e) => {
			if (this.gameManager.player.order == e.order) this.#isSelectable = true;
		});

		this.gameManager.addEventListener('put_pass', (e) => {
			if (this.gameManager.player.order != e.order) return;
			for (let hitbox of this.#hitboxes) hitbox.visible = false;
			this.#isSelectable = false;
			this.#playerAct = 'pass';
		});

		this.gameManager.addEventListener('put_success', (e) => {
			if (this.gameManager.player.order == e.order) {
				for (let hitbox of this.#hitboxes) hitbox.visible = false;
				this.#isSelectable = false;
			}

			this.#playerAct = 'put'
		});

		this.gameManager.addEventListener('bang_success', (e) => {
			this.#playerAct = 'bang';
			this.#posDiff = e.pos;
		});

		this.gameManager.addEventListener('confirmed', async () => {
			if (this.#playerAct == 'bang') {
				this.cameraManager.restore();
				await sleep(500);
				await this.diskMeshFlip(this.gameManager.board.table, this.#posDiff);
			} else {
				await this.diskMeshUpdate(this.gameManager.board.table);
			}
			this.gameManager.dispatchEvent(new Event.UpdateCompleteEvent());
		});

		// Listener delete
		this.gameManager.addEventListener('game_over', () => {
			this.logger.log("delete click callback");
			// console.log("delete click callback");
			clickController.abort();
			this.logger.log("delete mousemove callback");
			// console.log("delete mousemove callback");
			mousemoveController.abort();
		});

	}

	run() {
		let d = this.#clock.getDelta();
		for (let mixer of this.#animationMixers) {
			if(mixer){
				mixer.update(d);
			}
		}
	}

	async init() {
		const ambientLight = new THREE.AmbientLight(0xffffff, 1.75);
		const directionalLight0 = new THREE.DirectionalLight(0xffffff, 1);
		const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
		const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
		const directionalLight3 = new THREE.DirectionalLight(0xffffff, 1);
		const lights = [directionalLight0, directionalLight1, directionalLight2, directionalLight3];
		directionalLight0.position.set(25, 25, -25);
		directionalLight1.position.set(-25, 25, -25);
		directionalLight2.position.set(-25, 25, 25);
		directionalLight3.position.set(-25, 25, -25);
		for (let light of lights) {
			light.intensity = 0.75;
			this.scene.add(light);
		}

		const radius = this.gameManager.board.shockThreshold / 16;
		const cylinder = new THREE.Mesh(
			new THREE.CylinderGeometry(radius, radius, 1, 30),
			new THREE.MeshPhongMaterial({color: 0xff0000, opacity: 0.5, transparent: true})
		);
		cylinder.visible = false;
		cylinder.position.set(0, 1.9, 0);
		this.#selectArea = cylinder;

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
			await this.diskMeshUpdate(this.gameManager.board.table);
			this.gameManager.dispatchEvent(new Event.UpdateCompleteEvent())
		});
	}

	async animationFlip(disk_num, order) {
		let disk = this.#diskModels[disk_num];
		let action = this.#animationMixers[disk_num].clipAction(disk.animations[order]);
		let duration = disk.animations[order].duration;

		action.timeScale = 1;
		action.setLoop(THREE.LoopOnce);
		action.clampWhenFinished = true;

		this.logger.log(` |... animation start [flip :to${order == Disk.BLACK? "B": "W"}]`);
		// console.log(` |... animation start [flip :to${order == Disk.BLACK? "B": "W"}]`);
		action.reset().play();
		await sleep(duration*1000);
		this.logger.log(" |... animation end");
		// console.log(" |... animation end");
		action.stop();
		this.gameManager.audio.flip.cloneNode().play();

		disk.scene.rotation.z += Math.PI;
		disk.scene.rotation.z %= 2 * Math.PI;
	}

	async animationPut(disk_num, order) {
		let disk = this.#diskModels[disk_num];
		let action = this.#animationMixers[disk_num].clipAction(disk.animations[1-order + 2]);
		let duration = disk.animations[1-order + 2].duration;

		disk.scene.visible = true;
		disk.scene.rotation.z = order * Math.PI;

		action.timeScale = 5;
		action.setLoop(THREE.LoopOnce);
		action.clampWhenFinished = true;

		this.logger.log(` |... animation start [put :${order == Disk.BLACK? "B": "W"}]`);
		// console.log(` |... animation start [put :${order == Disk.BLACK? "B": "W"}]`);
		action.reset().play();
		await sleep(duration*200);
		this.logger.log(" |... animation end");
		this.gameManager.audio.put.cloneNode().play();
		// console.log(" |... animation end");
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
					box.cellX = j;
					box.cellY = i;
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
					this.#diskModels.push(model);
					this.#diskAnimations.push(model.animations);
					this.#animationMixers.push(mixer);
					this.scene.add(model.scene);
				}
			}
			res();
		});
	}

	async diskMeshFlip(table, put_pos) {
		let duration = this.#diskModels[0].animations[2].duration;
		this.gameManager.audio.bang.play();
		await sleep(100);
		this.cameraManager.shake(duration);
		for (let pos of put_pos) {
			let num = pos.y*8+pos.x;
			if (table[num].state == Disk.EMPTY) continue;
			let order = table[num].state == Disk.WHITE ? Disk.WHITE : Disk.BLACK;
			this.#currentTable[num] = table[num].state;
			this.animationFlip(num, order);
		}
		await sleep(duration*400);
	}

	async diskMeshUpdate(table, put_pos, rev_pos) {
		for (let i = 0; i < 8*8; i++) {
			if (this.#currentTable[i] != table[i].state) {
				if (this.#currentTable[i] == Disk.EMPTY) {
					this.#currentTable[i] = table[i].state;
					switch (table[i].state) {
						case Disk.WHITE:
							await this.animationPut(i, Disk.WHITE);
							break;
						case Disk.BLACK:
							await this.animationPut(i, Disk.BLACK);
					}
				}
			}
		}
		for (let i = 0; i < 8*8; i++) {
			if (this.#currentTable[i] != table[i].state) {
				if (this.#currentTable[i] == Disk.WHITE) {
					await this.animationFlip(i, Disk.BLACK);
				} else {
					await this.animationFlip(i, Disk.WHITE);
				}
			}
			this.#currentTable[i] = table[i].state;
		}
	}

	toggleMode(mode, target = null) {
		if (mode == this.mode) {
			this.mode = GameSection.MODE_NONE;
			this.cameraManager.controlable = true;
		} else {
			this.mode = mode;
		}
		this.logger.log(`MODE UPDATE: ${this.mode}`);
		// console.log(`MODE UPDATE: ${this.mode}`)
	}

	get mode() {return this.#mode;}
	set mode(mode) {this.#mode = mode;}
}