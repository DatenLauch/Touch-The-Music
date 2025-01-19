import * as THREE from 'three';

export default class Input {

    constructor(button, camera) {
        this.button = button;
        this.camera = camera;
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.intersectedObject = null;
    }

    async init() {
        window.addEventListener('mousemove', this.#onMouseMove.bind(this));
        window.addEventListener('click', this.#onMouseClick.bind(this));
    }

    #onMouseMove(event) {
        if (this.mouse) {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        }
    }

    #onMouseClick() {
        if (this.intersectedObject && this.button) {
            if (this.intersectedObject === this.button) {
                const randomColor = new THREE.Color(Math.random(), Math.random(), Math.random());
                this.button.backgroundColor.set(randomColor);
            }
        }
    }

    update(deltaTime) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects([this.button]);

        if (intersects.length > 0) {
            if (this.intersectedObject !== this.button) {
                this.intersectedObject = this.button;
                this.button.backgroundColor.set(0x007bff);
            }
        } else {
            if (this.intersectedObject !== null) {
                this.intersectedObject.backgroundColor.set(0x0056bb);
                this.intersectedObject = null;
            }
        }
    }
}