import * as THREE from "three";
import { model_load } from "../../utils.js";
import { Disk, Board } from "../../object.js";
import Section from "../section.js";
import * as Event from "../../event.js";

export default class ResultSection extends Section {

	constructor(game_manager, renderer_manager, scene) {
		super(game_manager, renderer_manager, scene);
	}

	run() {}
	init() {
		const geometry = new THREE.BoxGeometry(5, 5, 5);
		const material = new THREE.MeshStandardMaterial({color: 0x0000FF});
		const box = new THREE.Mesh(geometry, material);
		this.scene.add(box);
	}
}