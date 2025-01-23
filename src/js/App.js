import UIManager from '/src/js/UIManager';
import AudioManager from '/src/js/AudioManager';
import ThreeManager from '/src/js/ThreeManager.js';
import XRManager from '/src/js/XRManager.js';
import InputManager from '/src/js/InputManager';
import ScoreManager from '/src/js/ScoreManager';
import NoteManager from '/src/js/NoteManager';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Track1 } from './tracks/track1.js';
import { DifficultySettings } from './DifficultySettings.js';

class App {
    constructor() {
        this.uiManager = null;
        this.audioManager = null;
        this.inputManager = null;
        this.threeManager = null;
        this.scoreManager = null;
        this.noteManager = null;
        this.xrManager = null;
        this.systems = [];
        this.previousTime = 0;
        this.update = this.#update.bind(this);
    }

    async init() {
        this.uiManager = new UIManager();
        await this.uiManager.init();
        this.systems.push(this.uiManager);

        this.audioManager = new AudioManager();
        await this.audioManager.init();

        this.scoreManager = new ScoreManager();
        this.scoreManager.init();

        this.gltfloader = new GLTFLoader();

        this.threeManager = new ThreeManager(this.uiManager, this.audioManager, this.scoreManager, this.gltfloader, DifficultySettings.medium);
        await this.threeManager.init();
        this.systems.push(this.threeManager);

        this.noteManager = new NoteManager(this.threeManager, Track1);
        this.noteManager.init();
        this.noteManager.loadTrack(Track1);
        this.systems.push(this.noteManager);

        /*this.inputManager = new InputManager(this.ui.testButton, this.threeManager.camera);
        await this.inputManager.init();
        this.systems.push(this.inputManager); */

        if (navigator.xr) {
            this.xrManager = new XRManager(this.threeManager);
            let xrButtonContainer = await this.#createXRButtons();
            if (xrButtonContainer) {
                document.body.append(xrButtonContainer);
            }
            this.systems.push(this.xrManager);
        }
        requestAnimationFrame(this.update);
    }

    async #createXRButtons() {
        const isArSupported = await navigator.xr.isSessionSupported('immersive-ar');
        const isVrSupported = await navigator.xr.isSessionSupported('immersive-vr');
        let container = null;
        if (isArSupported || isVrSupported) {
            container = this.#createXRButtonsContainer();
        }
        if (isArSupported) {
            const arButton = await this.#createButton('Start AR', async () => {
                await this.xrManager.initAR();
                this.noteManager.start();
            });
            container.append(arButton);
        }
        if (isVrSupported) {
            const vrButton = await this.#createButton('Start VR', async () => {
                await this.xrManager.initVR();
                this.noteManager.start();
            });
            container.append(vrButton);
        }
        return container;
    }

    #createXRButtonsContainer() {
        const container = document.createElement('div');
        container.classList.add('xr-buttons-container');
        return container;
    }

    async #createButton(buttonText, onClickHandler) {
        const button = document.createElement('button');
        button.innerText = buttonText;
        button.addEventListener('click', async () => {
            await onClickHandler();
            button.parentElement.remove();
        });
        return button;
    }

    #update(time, frame) {
        const deltaTime = time - this.previousTime;
        this.previousTime = time;

        this.systems.forEach(system => system.update(deltaTime, frame));
        this.threeManager.render();

        if (this.xrManager?.session) {
            this.xrManager.session.requestAnimationFrame(this.update);
        }
        else
            requestAnimationFrame(this.update);
    }
}

const app = new App();
document.addEventListener('DOMContentLoaded', async () => {
    await app.init();
});