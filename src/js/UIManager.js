import * as THREE from 'three';
import ThreeMeshUI from "three-mesh-ui";
import FontJSON from '/src/assets/fonts/Roboto-msdf.json';
import FontImage from '/src/assets/fonts/Roboto-msdf.png';

export default class UIManager {
    constructor() {
        this.fontJSON = FontJSON;
        this.fontImage = FontImage;
    }

    async init() {
        this.fontJSON = FontJSON;
        this.fontImage = FontImage;
    }

    createButton(text) {
        const button = new ThreeMeshUI.Block({
            width: 1,
            height: 1,
            color: 0xFF00FF,
            backgroundColor: new THREE.Color(0x0000ff),
        });
        if (text) {
            const buttonLabel = this.createText(text);
            button.add(buttonLabel);
        }
        return button;
    }

    createText(text) {
        const textMesh = new ThreeMeshUI.Text({
            width: 0.75,
            height: 0.25,
            content: text,
            wrapText: false,
            fontFamily: this.fontJSON,
            fontTexture: this.fontImage,
            fontSize: 0.1,
            fontColor: new THREE.Color(0xFFFFFF),
            outlineWidth: 0.2, 
            outlineColor: new THREE.Color(0x000000), 
        });

        const block = new ThreeMeshUI.Block({
            justifyContent: 'center',
            alignItems: 'center',
            padding: 0.1,
            backgroundOpacity: 0,
            width: textMesh.width,
            height: textMesh.height,
        });
        block.text = textMesh;
        block.add(textMesh);
        return block;
    }

    update(deltaTime) {
        ThreeMeshUI.update();
    }
}