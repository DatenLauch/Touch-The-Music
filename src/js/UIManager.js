import * as THREE from 'three';
import ThreeMeshUI from "three-mesh-ui";
import FontJSON from '/src/assets/fonts/Roboto-msdf.json';
import FontImage from '/src/assets/fonts/Roboto-msdf.png';

export default class UIManager {
    constructor() {
        this.fontJSON = null;
        this.fontImage = null;
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
            width: 1,
            height: 0.25,
            content: text,
            wrapText: true,
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

    createStartScreen(){
        const startScreenContainer = new ThreeMeshUI.Block({
            width: 3,
            height: 2.75,
            fontFamily: this.fontJSON,
            fontTexture: this.fontImage,
            fontColor: new THREE.Color(0xffffff),
            backgroundOpacity: 0.7,
        });

        return startScreenContainer;
    }

    createEndScreen(scoreData) {
        const endScreenContainer = new ThreeMeshUI.Block({
            fontFamily: this.fontJSON,
            fontTexture: this.fontImage,
            fontColor: new THREE.Color(0xffffff),
            backgroundOpacity: 0.7,
        });

        const titleBlock = new ThreeMeshUI.Block({
            width: 3,
            height: 0.25,
            justifyContent: "center",
            alignItems: "center",
            fontSize: 0.2,
        }).add(
            new ThreeMeshUI.Text({
                content: "Track Complete!",
            })
        );

        endScreenContainer.add(titleBlock);

        const contentContainer = new ThreeMeshUI.Block({
            contentDirection: "row",
            justifyContent: "space-evenly",
            backgroundOpacity: 0,
        });

        const performancePanel = this.#createEndScreenPerformanceSection(scoreData);
        const hitsPanel = this.#createEndScreenHitsSection(scoreData);

        endScreenContainer.add(contentContainer);
        contentContainer.add(performancePanel);
        contentContainer.add(hitsPanel);

        return endScreenContainer;
    }

    #createEndScreenPerformanceSection(scoreData) {
        const statsPanel = new ThreeMeshUI.Block({
            width: 1.5,
            height: 2.5,
            justifyContent: "center",
            alignItems: "center",
            backgroundOpacity: 0.5,
        });

        statsPanel.add(
            new ThreeMeshUI.Text({
                content: "\n\nPerformance\n\n",
                fontSize: 0.15,
            }),
            new ThreeMeshUI.Text({
                content: "Score\n" + scoreData.points + "\n\n Best Combo\n" + scoreData.combo + "\n\n Accuracy\n" + scoreData.accuracy + "%" + "\n\n\n\n\n",
                fontSize: 0.12,
            })
        );

        return statsPanel;
    }

    #createEndScreenHitsSection(scoreData) {
        const hitsPanel = new ThreeMeshUI.Block({
            width: 1.5,
            height: 2.5,
            justifyContent: "center",
            alignItems: "center",
            backgroundOpacity: 0.5,
        });

        hitsPanel.add(
            new ThreeMeshUI.Text({
                content: "\n\nHits\n\n",
                fontSize: 0.15,
            }),
            new ThreeMeshUI.Text({
                content: "Good\n" + scoreData.good + "\n\n Early\n" + scoreData.early + "\n\n Late\n" + scoreData.late + "\n\nMiss\n" + scoreData.miss + "\n\n",
                fontSize: 0.12,
            })
        );
        return hitsPanel;
    }

    update(deltaTime) {
        ThreeMeshUI.update();
    }
}
