import Three from '/src/js/Three.js';
import XR from '/src/js/XR.js';
import UI from '/src/js/UI';
import Input from '/src/js/Input';
import ScoreManager from '/src/js/ScoreManager';
import NoteManager from '/src/js/NoteManager';
import { Track1 } from './tracks/track1.js';
import { Difficulty } from './Difficulty.js';

class App {
    constructor() {
        this.three = null;
        this.xr = null;
        this.ui = null;
        this.input = null;
        this.notes = null;
        this.systems = [];
        this.previousTime = 0;
        this.update = this.#update.bind(this);
    }

    async init() {

        /*this.ui = new UI();
        this.ui.init();*/

        this.scoreManager = new ScoreManager();
        this.scoreManager.init();

        this.three = new Three(this.scoreManager, Difficulty.easy);
        await this.three.init();
        this.systems.push(this.three);

        this.noteManager = new NoteManager(this.three, Track1);
        this.noteManager.init();
        this.noteManager.loadTrack(Track1);
        this.systems.push(this.noteManager);

        /*this.input = new Input(this.ui.testButton, this.three.camera);
        await this.input.init();
        this.systems.push(this.input); */

        if (navigator.xr) {
            this.xr = new XR(this.three);
            let xrButtonContainer = await this.#createXRButtons();
            if (xrButtonContainer) {
                document.body.append(xrButtonContainer);
            }
            this.systems.push(this.xr);
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
                await this.xr.initAR();
                this.noteManager.start();
            });
            container.append(arButton);
        }
        if (isVrSupported) {
            const vrButton = await this.#createButton('Start VR', async () => {
                await this.xr.initVR();
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
        this.three.render();

        if (this.xr?.session) {
            this.xr.session.requestAnimationFrame(this.update);
        }
        else
            requestAnimationFrame(this.update);
    }
}

const app = new App();
document.addEventListener('DOMContentLoaded', async () => {
    await app.init();
});