class RendererManager {
	static SCREEN_WIDTH;
	static SCREEN_HEIGHT;

	#object_pool;

	#renderer;
	#scene;
	#camera;
	#controls;
	#mouse;
	#pointer;
	#raycaster = new THREE.Raycaster();

	constructor (object_pool) {
		// def renderer
		this.#renderer = new THREE.WebGLRenderer({
			canvas: document.getElementById('main-canvas');
			antialias: true,
			alpha: true,
		});
		this.#renderer.setPixelRatio(window.devicePixelRatio);
		this.#renderer.setSize(window.innerWidth, window.innerHeight);

		// def scene
		this.#scene = new THREE.Scene();

		// def camera
		this.#camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight);
		this.#camera.position.set(5, 5, 25);
		this.#controls = new THREE.OrbitControls(this.#camera, this.#renderer.domElement);

		// def mouse vec
		this.#mouse = new THREE.Vector2({x: 0, y: 0})
	}

	tick () {
		this.#raycaseter.setFromCamera(this.#mouse, this.#camera);
		this.#raycaseter.params.Line.threshold = 0;

		this.#controls.update();
		this.#renderer.render(this.#scene, this.#camera);
	}

	add (object) {
		this.#scene.add(object)
	}

	getIntersectObject(objects) {
		return this.#raycaseter.intersectObjects(objects);
	}

	render(scene) {
		this.#renderer.render(this.#scene)
	}
}