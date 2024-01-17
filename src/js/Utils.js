import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

async function model_load(gltf_path, on_load_func, on_progress_func, on_error_func) {
	const loader = new GLTFLoader();
	return new Promise(res => {
		loader.load(gltf_path, (obj) => {
			on_load_func(obj);
			res();
		}, (xhr) => {
			if (on_progress_func) on_progress_func(xhr);
		}, (error) => {
			if (on_error_func) on_error_func(error);
		});
	});
}

async function sleep(ms) {
	return new Promise(res => setInterval(res, ms));
}

function is_empty(object) {
	if (object == null) return true;
	if (object == undefined) return true;
	return Object.keys(object).length === 0
}

export { model_load, sleep, is_empty };