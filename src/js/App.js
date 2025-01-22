import Three from '/src/js/Three.js';
import XR from '/src/js/XR.js';
import UI from '/src/js/UI';
import Input from '/src/js/Input';
import NoteReader from '/src/js/NoteReader';
import { track1 } from './track1.js';

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
        this.three = new Three();
        await this.three.init();
        this.systems.push(this.three);

        /*this.ui = new UI(this.three.scene);
        await this.ui.init();
        this.systems.push(this.ui);

        this.input = new Input(this.ui.testButton, this.three.camera);
        await this.input.init();
        this.systems.push(this.input); */

        this.noteReader = new NoteReader(this.three, track1);
        await this.noteReader.init();
        this.systems.push(this.noteReader);

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
            });
            container.append(arButton);
        }
        if (isVrSupported) {
            const vrButton = await this.#createButton('Start VR', async () => {
                await this.xr.initVR();
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