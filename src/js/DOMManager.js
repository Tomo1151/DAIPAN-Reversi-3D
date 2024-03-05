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
	#titleScreenDOM;
	#startButton;

	#ingameUIContainer;
	#cutDOM;
	#ingameButtons;
	// #putButton;
	#passButton;
	#bangButton;

	#resultScreenDOM;
	#restartButton;

	#playerAngerDOM;
	#shareLink;

	#DOMEventController;

	constructor(gameManager, rendererManager, cameraManager) {
		this.#gameManager = gameManager;
		this.#rendererManager = rendererManager;
		this.#cameraManager = cameraManager;

		this.#titleScreenDOM = document.getElementById('title_screen');
		this.#startButton = document.getElementById('start_button');
		this.#ingameUIContainer = document.getElementById('ingame_ui');
		this.#cutDOM = document.getElementById('cut');
		this.#ingameButtons = document.getElementById('action_button');
		[this.#passButton, this.#bangButton] = this.#ingameButtons.children;
		this.#resultScreenDOM = document.getElementById('result_screen');
		this.#restartButton = document.getElementById('restart_button');
		this.#playerAngerDOM = document.getElementById('meter_value');
		this.#playerAngerDOM.style.height = `0%`;
		this.#shareLink = document.getElementById('share_button');
		this.hide(this.#bangButton);

		this.#DOMEventController = new AbortController();

		this.#gameManager.addEventListener('turn_notice', (e) => {
			if (e.order != this.#gameManager.player.order) return;
			// console.log(this.#gameManager.player);


			if (e.canPut) {
				// this.#putButton.classList.remove('disabled');
				this.#passButton.classList.add('disabled');
				this.#bangButton.classList.remove('disabled');
				if(this.#gameManager.player.anger >= this.#gameManager.player.patience) {
					this.show(this.#bangButton);
					this.show(document.getElementById("steam_left"));
					this.show(document.getElementById("steam_right"));
				}
			} else {
				// this.#putButton.classList.add('disabled');
				this.#passButton.classList.remove('disabled');
				this.#bangButton.classList.add('disabled');
			}
		});

		this.#gameManager.addEventListener('put_success', (e) => {
			if (e.order == this.#gameManager.player.order) {
				// this.#putButton.classList.add('disabled');
				this.#passButton.classList.add('disabled');
				this.#bangButton.classList.add('disabled');
			}
		});

		this.#gameManager.addEventListener('bang_success', (e) => {
			if (e.order == this.#gameManager.player.order) {
				// this.#putButton.classList.add('disabled');
				this.#passButton.classList.add('disabled');
				this.#bangButton.classList.add('disabled');
				this.#gameManager.currentSection.mode = GameSection.MODE_PUT;
				this.show(this.#ingameButtons);
				this.hide(document.getElementById("steam_left"));
				this.hide(document.getElementById("steam_right"));
			}
		});

		this.#gameManager.addEventListener('game_over', async (e) => {
			// await sleep(1500);
			// this.#putButton.classList.remove('active');
			// this.#putButton.classList.add('disabled');
			this.#bangButton.classList.remove('active');
			this.#bangButton.classList.add('disabled');

			this.hide(this.#ingameUIContainer);
			await sleep(50);
			await this.cutin("ゲーム終了", this.#gameManager.audio.start, 2000);
			await sleep(750);
			// console.log(e.result);
			this.createShareLink(e.result.result);
			this.drawResultScreen(e.result);
		});

		this.#gameManager.addEventListener('game_restart', () => {
			this.#gameManager.logger.log('GAME RESTART');
			// console.log('GAME RESTART');
			this.hide(this.#resultScreenDOM);
			this.hide(this.#ingameUIContainer);
			this.show(this.#titleScreenDOM);

			this.#DOMEventController.abort();
		});
	}



	addDOMEventListeners() {
		const cautionScreen = document.getElementById('caution_screen');
		const onOrientationChange = () => {
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

		screen.orientation.addEventListener('change', () => {
			if (!screen.orientation.type.includes('landscape')) {
				this.show(cautionScreen, true);
			} else {
				onOrientationChange();
				this.hide(cautionScreen);
			}
		}, { signal: this.#DOMEventController.signal });

		// def Game Events
		this.#startButton.addEventListener('click', async () => {
			// Setting DOMs
			this.#gameManager.logger.log("* send: game_start");
			// console.log("* send: game_start");console.log("");
			this.orderUpdate();
			this.hide(this.#titleScreenDOM);

			this.#gameManager.audio.open.play();
			await this.cutin("ゲームスタート", this.#gameManager.audio.start, 2000);

			this.show(this.#ingameUIContainer);

			this.#gameManager.dispatchEvent(new Event.GameStartEvent());
			this.#gameManager.mode = (document.getElementById('game_mode').checked) ? GameManager.MODE_HOTHEADED : GameManager.MODE_NORMAL;
			if (this.#gameManager.mode === GameManager.MODE_HOTHEADED) this.#gameManager.player.patience = 10;
			// console.log(this.#gameManager.player)
			// console.log(`MODE: ${this.#gameManager.mode == 0? "normal" : "hotheaded"}`);
			document.getElementById("boiling_point").style.bottom = `${this.#gameManager.player.patience}%`;
		}, { signal: this.#DOMEventController.signal });


		/*
		 * GameSection
		 */

		// this.#putButton.addEventListener('click', () => {
		// 	if (this.#gameManager.currentTurn != this.#gameManager.player.order) return;
		// 	this.#bangButton.classList.remove('active');
		// 	this.#putButton.classList.toggle('active');
		// 	this.#gameManager.currentSection.toggleMode(GameSection.MODE_PUT);
		// }, { signal: this.#DOMEventController.signal });

		this.#passButton.addEventListener('click', () => {
			if (this.#gameManager.currentTurn != this.#gameManager.player.order || this.#gameManager.checkTable(this.#gameManager.player.order)) return;
			this.#gameManager.dispatchEvent(new Event.PutPassEvent(this.#gameManager.player.order));
			this.#passButton.classList.add('disabled');
		}, { signal: this.#DOMEventController.signal });

		this.#bangButton.addEventListener('click', async () => {
			if (this.#gameManager.currentTurn != this.#gameManager.player.order) return;
			// this.#putButton.classList.remove('active');
			// this.#bangButton.classList.toggle('active');
			this.hide(this.#ingameButtons);
			this.hide(this.#bangButton);
			this.#gameManager.currentSection.mode = GameSection.MODE_BANG;
			this.#cameraManager.moveTo(0, 100, 0, new THREE.Vector3(0, 0, 0), false, () => {}, 20)
			await this.cutin("たたけ!", this.#gameManager.audio.bang_cut, 1000);
		}, { signal: this.#DOMEventController.signal });

		/*
		 * ResultSection
		 */
		this.#restartButton.addEventListener('click', (e) => {
			this.#gameManager.dispatchEvent(new Event.GameRestartEvent());
		}, { signal: this.#DOMEventController.signal });
	}

	drawResultScreen(result) {
		let resultWinner = document.getElementById('winner');
		let resultScore = document.getElementById('score');
		let resultNameBlack = document.getElementById('order_black_name');
		let resultNameWhite = document.getElementById('order_white_name');
		let resultBlack = document.getElementById('order_black');
		let resultWhite = document.getElementById('order_white');
		let resultTime = document.getElementById('time');
		let maxLength = Math.max(3, (this.#gameManager.player.name?.length || 6));

		let dt = this.#gameManager.endTime.getTime() - this.#gameManager.startTime.getTime();
		let dh = dt / (1000*60*60);
		let dm = (dh - Math.floor(dh)) * 60;
		let ds = (dm - Math.floor(dm)) * 60;

		let result_str = '';

		this.show(this.#resultScreenDOM);

		if (result.result == Disk.EMPTY) {
			result_str = '引き分け!';
		} else {
			result_str = `${(result.result == Disk.WHITE) ? (this.#gameManager.player.name || "Player") : "COM"}の勝ち!`;
		}


		resultWinner.innerText = result_str;
		resultScore.innerText = this.#gameManager.player.point;
		resultNameWhite.innerText = `${this.getPlayerName() || "Player"}`;
		resultNameWhite.style.width = `${maxLength+1}rem`;
		resultWhite.innerText = ` : ${result.white}`;
		resultNameBlack.innerText = `${this.#gameManager.enemy.name}`
		resultNameBlack.style.width = `${maxLength+1}rem`;
		resultBlack.innerText = ` : ${result.black}`;
		resultTime.innerText = `${('00' + Math.floor(dh)).slice(-2)}:${('00' + Math.floor(dm)).slice(-2)}:${('00' + Math.round(ds)).slice(-2)}`;
	}

	createShareLink(result) {
		const result_str = [" 勝利😎", " 敗北☹️", " 引き分け😶"];
		const score = this.#gameManager.player.point;
		const text = `台パンリバーシで${score}点を取ったよ！ [${result_str[result]}]\n`;
		const link = `http://twitter.com/share?url=reversi.syntck.com&text=${text}&hashtags=台パンリバーシ`;
		this.#shareLink.setAttribute("href", link);

	}

	async cutin(str, sound, ms) {
		this.#cutDOM.children[0].innerText = str;
		this.show(this.#cutDOM);
		this.#cutDOM.classList.add('fadeIn');
		await sleep(ms / 10 * 1);
		sound.pause();
		sound.currentTime = 0;
		sound.play();
		await sleep(ms / 10 * 9);
		this.hide(this.#cutDOM);
		this.#cutDOM.classList.remove('fadeIn');
	}

	show(dom, isFlex = false) {
		if (isFlex) {
			dom.style.display = "flex";
		} else {
			dom.style.display = "block";
		}
	}

	getPlayerName() {
		return document.getElementById('player_name').value || null;
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
		let angerValue = this.#gameManager.player.anger;
		this.#playerAngerDOM.style.height = `${Math.min(angerValue, 98)}%`;
	}

	hide(dom) {
		dom.style.display = "none";
	}

	modeReset() {
		// this.#putButton.classList.remove('active');
		this.#bangButton.classList.remove('active');
		this.#gameManager.currentSection.mode = GameSection.MODE_NONE;
	}
}