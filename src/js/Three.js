import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import Audio from '/src/js/Audio';

export default class Three {
    constructor() {
        this.renderer = null;
        this.camera = null;
        this.scene = null;
        this.directionalLight = null;
        this.ambientLight = null;
        this.audio = null;
        this.gltfloader = null;
        this.drums = [];
        this.hands = [];
        this.collidingObjects = new Set();
    }

    async init() {
        window.addEventListener('resize', this.#onWindowResize.bind(this));
        this.renderer = this.#initRenderer();
        document.body.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.7, 0);

        this.scene = new THREE.Scene();

        this.ambientLight = new THREE.AmbientLight(0xffffff)
        this.scene.add(this.ambientLight);
        this.directionalLight = new THREE.DirectionalLight(0xffffff);
        this.directionalLight.castShadow = true;
        this.directionalLight.position.set(1, 1, 1).normalize();
        this.scene.add(this.directionalLight);

        this.audio = new Audio();
        await this.audio.init();

        this.gltfloader = new GLTFLoader();
        await this.#initHands('src/assets/models/hand/hand.gltf');
        this.#initDrums();
    }

    #onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    #initRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        return renderer;
    }

    async #initHands(path) {
        this.gltfloader.load(
            path,
            (gltf) => {
                const model = gltf.scene;

                this.leftHand = model;
                this.hands.push(this.leftHand);
                this.scene.add(this.leftHand);
                this.leftHand.onCollision = (collider) => {

                };
                this.leftHand.onCollisionEnd = (collider) => {
                }

                const mirroredHand = model.clone();
                mirroredHand.scale.x = -1;

                this.rightHand = mirroredHand;
                this.hands.push(this.rightHand);
                this.scene.add(this.rightHand);

                this.rightHand.onCollision = (collider) => {
                };
                this.rightHand.onCollisionEnd = (collider) => {
                }
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('An error happened while loading the model:', error);
            }
        );
    }

    #initDrums() {
        const snare = this.#createDrum(0.5, 0.1, 0.1, 'snare');
        snare.position.set(-0.75, 1, -2);
        snare.outer.material.color.set(0xFF0000);
        this.drums.push(snare);
        this.scene.add(snare);

        const kick = this.#createDrum(0.5, 0.1, 0.1, 'kick');
        kick.position.set(0.75, 1, -2);
        kick.outer.material.color.set(0x00FF00);
        this.drums.push(kick);
        this.scene.add(kick);

        const crash = this.#createDrum(0.5, 0.1, 0.1, 'crash');
        crash.position.set(-2.5, 1, -3);
        crash.outer.material.color.set(0x0000FF);
        this.drums.push(crash);
        this.scene.add(crash);

        const hihat = this.#createDrum(0.5, 0.1, 0.1, 'hihat');
        hihat.position.set(2.5, 1, -3);
        hihat.outer.material.color.set(0xFFFF00);
        this.drums.push(hihat);
        this.scene.add(hihat);
    }


    #createDrum(radius, height, width, sound) {
        const middleGeometry = new THREE.CylinderGeometry(radius, radius, height, 32);
        const middleMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        const middle = new THREE.Mesh(middleGeometry, middleMaterial);
        middle.position.set(0, 0.001, 0);

        const outerGeometry = new THREE.CylinderGeometry(radius + width, radius + width, height, 32);
        const outerMaterial = new THREE.MeshStandardMaterial({ color: 0xFF00FF });
        const outer = new THREE.Mesh(outerGeometry, outerMaterial);

        const drum = new THREE.Group();
        drum.add(outer);
        drum.add(middle);
        drum.outer = outer;
        drum.middle = middle;
        drum.sound = sound;
        drum.onCollision = (collider) => {
            this.audio.playSound(drum.sound);
        };

        drum.onCollisionEnd = (collider) => {
        }
        return drum;
    }


    createQuaternion(x, y, z, w) {
        return new THREE.Quaternion(x, y, z, w);
    }


    update(deltaTime) {

        // collision
        if (this.hands && this.drums) {
            this.drums.forEach(drum => {
                this.hands.forEach(hand => {
                    this.#checkCollision(hand, drum);
                });
            });
        }
    }

    #checkCollision(object1, object2) {
        const box1 = new THREE.Box3().setFromObject(object1);
        const box2 = new THREE.Box3().setFromObject(object2);

        const collides = box1.intersectsBox(box2);
        // unique key to avoid circular onCollision / onCollisionEnd activation.
        const key = `${object1.uuid}-${object2.uuid}`;

        if (collides) {
            if (!this.collidingObjects.has(key)) {
                this.collidingObjects.add(key);
                object1.onCollision?.(object2);
                object2.onCollision?.(object1);
            }
        } else {
            if (this.collidingObjects.has(key)) {
                this.collidingObjects.delete(key);
                object1.onCollisionEnd?.(object2);
                object2.onCollisionEnd?.(object1);
            }
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}