import * as THREE from 'three';
import ThreeMeshUI from "three-mesh-ui";
import FontJSON from '/src/assets/fonts/Roboto-msdf.json';
import FontImage from '/src/assets/fonts/Roboto-msdf.png';

export default class UI {

    constructor(scene) {
        this.scene = scene;
        this.testButton = null;
    }

    async init() {
        this.testButton = this.#createNewButton(1, 2);
        this.testButton.position.set(0, 3.5, -3);
        this.scene.add(this.testButton);
    }

    #createNewButton(height, width) {
        const testButton = new ThreeMeshUI.Block({
            width: width,
            height: height,
            depth: 1,
            padding: 0.05,
            fontSize: 0.2,
            fontFamily: FontJSON,
            fontTexture: FontImage,
            backgroundColor: new THREE.Color(0x0077ff),
            backgroundOpacity: 1,
            justifyContent: "center",
            alignItems: "center",
        });
        testButton.add(new ThreeMeshUI.Text({ content: "3D Test Button" }));
        return testButton;
    }

    update(deltaTime) {
        ThreeMeshUI.update();
    }
}