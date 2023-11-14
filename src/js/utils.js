import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

async function model_load(fbx_path, on_load_func) {
	const loader = new GLTFLoader();
	return new Promise(res => {
		loader.load(fbx_path, (obj) => {
			on_load_func(obj);
			res();
		});
	});
}

async function sleep(ms) {
	return new Promise(res => setInterval(res, ms));
}

export { model_load, sleep };