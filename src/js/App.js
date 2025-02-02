import UIManager from '/src/js/UIManager';
import AudioManager from '/src/js/AudioManager';
import ThreeManager from '/src/js/ThreeManager.js';
import XRManager from '/src/js/XRManager.js';
import ScoreManager from '/src/js/ScoreManager';
import NoteManager from '/src/js/NoteManager';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Track1 } from './tracks/track1.js';
import { Track2 } from './tracks/track2.js';
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
        this.previousTime = 0;
    }

    async init() {
        this.uiManager = new UIManager();
        await this.uiManager.init();

        this.audioManager = new AudioManager();
        await this.audioManager.init();

        this.scoreManager = new ScoreManager();
        this.scoreManager.init();

        this.gltfloader = new GLTFLoader();

        //this.noteManager.loadTrack(Track2);

        this.threeManager = new ThreeManager(this.uiManager, this.audioManager, this.scoreManager, this.gltfloader, DifficultySettings.easy);
        await this.threeManager.init();

        this.noteManager = new NoteManager();
        this.noteManager.init();
        this.noteManager.setThree(this.threeManager);


        if (navigator.xr) {
            this.xrManager = new XRManager(this.threeManager, this.uiManager, this.noteManager);
            this.#createXRButtons();
        }

    }

    async #createXRButtons() {
        const isArSupported = await navigator.xr.isSessionSupported('immersive-ar');
        const isVrSupported = await navigator.xr.isSessionSupported('immersive-vr');
        if (isArSupported) {
            const arButton = await this.#createButton('Start AR', async () => {
                await this.xrManager.initAR();
            });
            document.getElementById('Intro').append(arButton);
        }
        if (isVrSupported) {
            const vrButton = await this.#createButton('Start VR', async () => {
                await this.xrManager.initVR();
            });
            document.getElementById('Intro').append(vrButton);
        }
    }

    async #createButton(buttonText, onClickHandler) {
        const button = document.createElement('button');
        button.innerText = buttonText;
        button.addEventListener('click', async () => {
            await onClickHandler();
        });
        return button;
    }
}

const app = new App();
document.addEventListener('DOMContentLoaded', async () => {
    await app.init();
});