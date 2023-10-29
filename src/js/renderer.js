window.addEventListener('load', init);

function init() {
	const canvas_element = document.getElementById('main-canvas');

	const renderer = new THREE.WebGLRenderer({
		antialias: true,
		canvas: canvas_element,
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setClearColor(new THREE.Color(0xffffff));
	renderer.shadowMap.enabled = true;

	const scene = new THREE.Scene();

	const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100000);
	camera.position.set(50, 50, 50);

	const controls = new THREE.OrbitControls(camera, canvas_element);

	// const geometry = new THREE.BoxGeometry(10, 10, 10);
	// const material = new THREE.MeshPhongMaterial({color: 0x0000ff});
	// const box = new THREE.Mesh(geometry, material);
	// box.castShadow = true;
	// scene.add(box);

	const l = new THREE.AmbientLight(0xffffff, 1);
	const light = new THREE.DirectionalLight(0xffffff, 10);
	light.intensity = 1;
	light.position.set(0, 0, 40);
	light.castShadow = true;
	light.shadowMapWidth = 2048;
	light.shadowMapHeight = 2048;
	// console.log(box)
	// scene.add(new THREE.AxesHelper(500));
	scene.add(l)
	scene.add(light);

	let hitboxes = [];

	const loader = new THREE.FBXLoader();
	const model_load = async (fbx_path, on_load_func) => {
		return new Promise(res => {
			loader.load(fbx_path, (obj) => {
				on_load_func(obj);
				res();
			});
		})
	}

	model_load('model_data/Board_low.fbx', (obj) => {
		obj.scale.set(5, 5, 5);
		obj.position.set(0, 0.5, 0);
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
				hitboxes.push(box);
				scene.add(box);
			}
		}
		scene.add(obj);
	});

	let disk_meshes = []

	model_load('model_data/Stone_low.fbx', (obj) => {
		let disk;
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				disk = obj.clone();
				disk.scale.set(4, 4, 4);
				disk.position.set(10*j - (10*3+5), 1, 10*i - (10*3+5));
				disk.visible = false;
				disk_meshes.push(disk);
				scene.add(disk);
			}
		}
	});


	let intersects = [];
	let selected_box;

	window.addEventListener('mousemove', (e) => {
		const raycaster = new THREE.Raycaster();
		const vec = new THREE.Vector2(
			(e.clientX / window.innerWidth) * 2 - 1,
			(e.clientY / window.innerHeight) * -2 + 1,
		);

		raycaster.setFromCamera(vec, camera);
		intersects = raycaster.intersectObjects(hitboxes);
		if (intersects.length > 0) {
			for (let hitbox of hitboxes) {
				if (hitbox == intersects[0].object) {
					hitbox.material.color = new THREE.Color(0xff0000);
					selected_box = hitbox;
				} else {
					hitbox.material.color = new THREE.Color(0x000000);
				}

			}
		} else {
			selected_box = undefined;
		}
	});

	window.addEventListener('click', (e) => {
		if (selected_box) {
			let x = selected_box.cell_x
			let y = selected_box.cell_y
			console.log(`x: ${x}, y: ${y}`);
			board.putDisk(Disk.WHITE, x, y)
			show_models();
			enemy.searchFirst(board);
			show_models();
		}
	})

	const show_models = () => {
		for (let i = 0; i < board.table.length; i++) {
			switch (board.table[i].state) {
				case Disk.WHITE:
					disk_meshes[i].rotation.z = 0;
					disk_meshes[i].visible = true;
					break;
				case Disk.BLACK:
					disk_meshes[i].rotation.z = Math.PI;
					disk_meshes[i].visible = true;
					break;
			}
			// if (disk_meshes[i].visible)	console.log(disk_meshes[i])
		}
	}

	const start_button = document.getElementById('start_button');
	start_button.addEventListener('click', () => {
		console.log("start");
		show_models();
	});

	tick();

	function tick() {
		controls.update();

		// box.rotation.x += 0.01;
		// box.rotation.y += 0.01;

		renderer.render(scene, camera);
		requestAnimationFrame(tick);
	}
}
