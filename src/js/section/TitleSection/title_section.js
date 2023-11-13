import * as THREE from "three";
import Section from "../section.js";

export default class TitleSection extends Section {

	constructor(game_manager, renderer_manager, scene) {
		super(game_manager, renderer_manager, scene);
	}

	run() {}

	init() {
		const light = new THREE.DirectionalLight(0xFFFFFF);
		light.intensity = 2; // 光の強さを倍に
		light.position.set(1, 1, 1); // ライトの方向

		const geometry = new THREE.BoxGeometry(5, 5, 5);
		const material = new THREE.MeshStandardMaterial({color: 0x0000FF});
		const box = new THREE.Mesh(geometry, material);
		this.scene.add(box);
		this.scene.add(light);
	}
}