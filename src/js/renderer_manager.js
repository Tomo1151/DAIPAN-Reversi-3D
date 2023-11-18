import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";


export default class RendererManager {
	static SCREEN_WIDTH;
	static SCREEN_HEIGHT;

	#game_manager;
	#object_pool;

	#renderer;
	#camera;
	#controls;
	#mouse;
	#raycaster;

	constructor (game_manager, object_pool) {
		// set game manager
		this.#game_manager = game_manager;

		// def renderer
		this.#renderer = new THREE.WebGLRenderer({
			canvas: document.getElementById('main-canvas'),
			antialias: true,
			alpha: true,
		});
		this.#renderer.setPixelRatio(window.devicePixelRatio);
		this.#renderer.setSize(window.innerWidth, window.innerHeight);

		// def camera
		this.#camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight);
		this.#camera.position.set(50, 50, 50);

		// def controls
		this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement);
		this.#controls.maxDistance = 135;
		this.#controls.minDistance = 30;
		this.#controls.maxZoom = 2;
		this.#controls.minZoom = 1.25;


		// def mouse vec
		this.#mouse = new THREE.Vector2({x: 0, y: 0});

		// def raycaster
		this.#raycaster = new THREE.Raycaster();

		window.addEventListener('resize', () => {
			this.#renderer.setSize(window.innerWidth, window.innerHeight);
			this.#renderer.setPixelRatio(window.devicePixelRatio);
			this.#camera.aspect = window.innerWidth / window.innerHeight;
			this.#camera.updateProjectionMatrix();
		})
	}

	getIntersectObject(objects) {
		return this.#raycaster.intersectObjects(objects);
	}

	setCursorPoint(mousemove_event) {
		this.#mouse.x = (mousemove_event.clientX / window.innerWidth) * 2 - 1;
		this.#mouse.y = (mousemove_event.clientY / window.innerHeight) * -2 + 1;

		return this.#mouse;
	}

	render(scene) {
		this.#renderer.render(scene, this.#camera);
	}

	get raycaster() {return this.#raycaster;}
	get mouse() {return this.#mouse;}
	get camera() {return this.#camera;}
	get controls() {return this.#controls;}
}