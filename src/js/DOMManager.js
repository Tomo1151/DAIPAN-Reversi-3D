import * as THREE from "three";
import * as Event from "./Event.js"
import { Disk } from "./Object.js";
import { sleep } from "./Utils.js";
import GameManager from "./GameManager.js";
import GameSection from "./section/GameSection/GameSection.js";
import Player from "./Player.js";

export default class DOMManager {
	#gameManager;
	#rendererManager;
	#cameraManager;

	#title_screen_dom;
	#start_button;

	#ingame_ui_container;
	#order_dom;
	#ingame_buttons;
	#put_button;
	#pass_button;
	#bang_button;

	#result_screen_dom;
	#restart_button;

	#player_anger;
	#player_anger_dom;

	#dom_event_controller;

	constructor(gameManager, rendererManager, cameraManager) {
		this.#gameManager = gameManager;
		this.#rendererManager = rendererManager;
		this.#cameraManager = cameraManager;

		this.#title_screen_dom = document.getElementById('title_screen');
		this.#start_button = document.getElementById('start_button');
		this.#ingame_ui_container = document.getElementById('ingame_ui');
		this.#order_dom = document.getElementById('order_div');
		this.#ingame_buttons = document.getElementById('action_button');
		this.#put_button = this.#ingame_buttons.children[0];
		this.#pass_button = this.#ingame_buttons.children[1];
		this.#bang_button = this.#ingame_buttons.children[2];
		this.#result_screen_dom = document.getElementById('result_screen');
		this.#restart_button = document.getElementById('restart_button');
		this.#player_anger_dom = document.getElementById('meter_value');
		this.#player_anger_dom.style.height = `0%`;
		this.hide(this.#bang_button);

		this.#dom_event_controller = new AbortController();

		this.#gameManager.addEventListener('turn_notice', (e) => {
			if (e.order != this.#gameManager.player.order) return;

			if (e.can_put) {
				this.#put_button.classList.remove('disabled');
				this.#pass_button.classList.add('disabled');
				this.#bang_button.classList.remove('disabled');
				if(this.#gameManager.player.anger >= Player.PATIENCE) this.show(this.#bang_button);
			} else {
				this.#put_button.classList.add('disabled');
				this.#pass_button.classList.remove('disabled');
				this.#bang_button.classList.add('disabled');
			}
		});

		this.#gameManager.addEventListener('put_success', (e) => {
			if (e.order == this.#gameManager.player.order) {
				this.#put_button.classList.add('disabled');
				this.#pass_button.classList.add('disabled');
				this.#bang_button.classList.add('disabled');
			}
		});

		this.#gameManager.addEventListener('bang_success', (e) => {
			if (e.order == this.#gameManager.player.order) {
				this.#put_button.classList.add('disabled');
				this.#pass_button.classList.add('disabled');
				this.#bang_button.classList.add('disabled');
				this.hide(this.#bang_button);
			}
		});

		this.#gameManager.addEventListener('game_over', async (e) => {
			await sleep(1500);
			this.#put_button.classList.remove('active');
			this.#put_button.classList.add('disabled');
			this.#bang_button.classList.remove('active');
			this.#bang_button.classList.add('disabled');
			this.draw_result_screen(e.result);
		});

		this.#gameManager.addEventListener('game_restart', () => {
			console.log('GAME RESTART');
			this.hide(this.#result_screen_dom);
			this.hide(this.#ingame_ui_container);
			this.show(this.#title_screen_dom);

			this.#dom_event_controller.abort();
		});
	}

	addDOMEventListeners() {
		const caution_screen = document.querySelector('.caution');
		const on_orientation_change = () => {
			let width = window.innerWidth;
			let height = window.innerHeight;
			if (width < height) [width, height] = [height, width];
			document.getElementById('main-canvas').style.width = width;
			document.getElementById('main-canvas').style.height = height;

			this.#rendererManager.renderer.setSize(window.innerWidth, window.innerHeight);
			this.#rendererManager.renderer.setPixelRatio(window.devicePixelRatio);
			this.#rendererManager.camera.aspect = window.innerWidth / window.innerHeight;
			this.#rendererManager.camera.updateProjectionMatrix();
		}

		window.addEventListener('DOMContentLoaded', () => {
			if (screen.orientation.type.indexOf('landscape') == -1) {
				this.show(caution_screen, true);
			}
		}, { signal: this.#dom_event_controller.signal });

		screen.orientation.addEventListener('change', async () => {
			if (screen.orientation.type.indexOf('landscape') == -1) {
				caution_screen.classList.remove('fadeOut');
				this.show(caution_screen, true);
			} else {
				await sleep(650);
				on_orientation_change();
				caution_screen.classList.add('fadeOut');
				await sleep(1000);
				this.hide(caution_screen);
			}
		}, { signal: this.#dom_event_controller.signal });

		// def Game Events
		document.getElementById('start_button').addEventListener('click', () => {
			// Setting DOMs
			console.log("* send: game_start");console.log("");
			this.orderUpdate();

			this.hide(this.#title_screen_dom);
			this.show(this.#ingame_ui_container);

			this.#gameManager.dispatchEvent(new Event.GameStartEvent());
		}, { signal: this.#dom_event_controller.signal });


		/*
		 * GameSection
		 */

		this.#put_button.addEventListener('click', () => {
			if (this.#gameManager.currentTurn != this.#gameManager.player.order) return;
			this.#bang_button.classList.remove('active');
			this.#put_button.classList.toggle('active');
			this.#gameManager.currentSection.toggle_mode(GameSection.MODE_PUT);
		}, { signal: this.#dom_event_controller.signal });

		this.#pass_button.addEventListener('click', () => {
			if (this.#gameManager.currentTurn != this.#gameManager.player.order || this.#gameManager.checkTable(this.#gameManager.player.order)) return;
			this.#gameManager.dispatchEvent(new Event.PutPassEvent(this.#gameManager.player.order));
			document.getElementById('pass_button').classList.add('disabled');
		}, { signal: this.#dom_event_controller.signal });

		this.#bang_button.addEventListener('click', () => {
			if (this.#gameManager.currentTurn != this.#gameManager.player.order) return;
			this.#put_button.classList.remove('active');
			this.#bang_button.classList.toggle('active');
			this.#gameManager.currentSection.toggle_mode(GameSection.MODE_BANG);
			this.#cameraManager.moveTo(0, 100, 0, new THREE.Vector3(0, 0, 0), false, () => {}, 20)
		}, { signal: this.#dom_event_controller.signal });

		/*
		 * ResultSection
		 */
		this.#restart_button.addEventListener('click', (e) => {
			this.#gameManager.dispatchEvent(new Event.GameRestartEvent());
		}, { signal: this.#dom_event_controller.signal });
	}

	draw_result_screen(result) {
		let dom_result_winner = document.getElementById('winner');
		let dom_result_score = document.getElementById('score');
		let dom_result_black = document.getElementById('order_black');
		let dom_result_white = document.getElementById('order_white');
		let dom_result_time = document.getElementById('time');

		let dt = this.#gameManager.endTime.getTime() - this.#gameManager.startTime.getTime();
		let dh = dt / (1000*60*60);
		let dm = (dh - Math.floor(dh)) * 60;
		let ds = (dm - Math.floor(dm)) * 60;

		let result_str = '';

		this.hide(this.#ingame_ui_container);
		this.show(this.#result_screen_dom);

		if (result.result == 'draw') {
			result_str = '引き分け!';
		} else {
			result_str = `${result.result}の勝ち!`;
		}

		dom_result_winner.innerText = result_str;
		dom_result_score.innerText = this.#gameManager.player.point;
		dom_result_white.innerText = `${this.getPlayerName()} : ${result.white}`;
		dom_result_black.innerText = `${this.#gameManager.enemy.name} : ${result.black}`;
		dom_result_time.innerText = `${('00' + Math.floor(dh)).slice(-2)}:${('00' + Math.floor(dm)).slice(-2)}:${('00' + Math.round(ds)).slice(-2)}`;
	}

	show(dom, is_flex = false) {
		if (is_flex) {
			dom.style.display = "flex";
		} else {
			dom.style.display = "block";
		}
	}

	getPlayerName() {
		return document.getElementById('player_name').value || 'Player';
	}

	orderUpdate(){
		let p = document.getElementById('order');
		if (this.#gameManager.currentTurn == Disk.BLACK) {
			p.children[0].innerText = '黒';
			p.classList.remove('order-white');
			p.classList.add('order-black');
		} else {
			p.children[0].innerText = '白';
			p.classList.remove('order-black');
			p.classList.add('order-white');
		}
	}

	angerUpdate() {
		let anger_value = this.#gameManager.player.anger;
		this.#player_anger_dom.style.height = `${anger_value}%`;
	}

	hide(dom) {
		dom.style.display = "none";
	}

	modeReset() {
		this.#put_button.classList.remove('active');
		this.#bang_button.classList.remove('active');
		this.#gameManager.currentSection.mode = GameSection.MODE_NONE;
	}
}