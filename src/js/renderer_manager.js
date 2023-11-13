import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";


export default class RendererManager {
	static SCREEN_WIDTH;
	static SCREEN_HEIGHT;

	#object_pool;

	#renderer;
	#camera;
	#controls;
	#mouse;
	#pointer;
	#raycaster;

	constructor (object_pool) {
		// def renderer
		this.#renderer = new THREE.WebGLRenderer({
			canvas: document.getElementById('main-canvas'),
			antialias: true,
			alpha: true,
		});
		this.#renderer.setPixelRatio(window.devicePixelRatio);
		this.#renderer.setSize(window.innerWidth, window.innerHeight);

		// def camera
		this.#camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight);
		this.#camera.position.set(25, 25, 25);

		// def controls
		this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement);
		this.#controls.maxDistance = 125;
		this.#controls.minDistance = 30;
		this.#controls.maxZoom = 2;
		this.#controls.minZoom = 1.25;


		// def mouse vec
		this.#mouse = new THREE.Vector2({x: 0, y: 0});

		// def raycaster
		this.#raycaster = new THREE.Raycaster()
	}

	getIntersectObject(objects) {
		return this.#raycaster.intersectObjects(objects);
	}

	render(scene) {
		// console.log(this.#camera)
		this.#renderer.render(scene, this.#camera);
	}
}