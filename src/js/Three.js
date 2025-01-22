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
        this.noteModel = null;
        this.handModel = null;
        this.hands = [];
        this.drums = new Map;
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
        this.handModel = await this.#loadGLTFModel('src/assets/models/hand/hand.gltf');
        this.#initHands();

        this.noteModel = await this.#loadGLTFModel('src/assets/models/note/note.gltf');
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

    async #loadGLTFModel(path) {
        return new Promise((resolve, reject) => {
            this.gltfloader.load(
                path,
                (gltf) => {
                    resolve(gltf.scene);
                },
                (xhr) => {
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                },
                (error) => {
                    console.error('An error occurred while loading the model:', error);
                    reject(error);
                }
            );
        });
    }

    async #initHands() {
        this.leftHand = this.handModel;
        this.leftHand.name = "leftHand";
        this.leftHand.onCollision = (collider) => {
        };
        this.leftHand.onCollisionEnd = (collider) => {
        };
        this.hands.push(this.leftHand);
        this.scene.add(this.leftHand);

        this.rightHand = this.handModel.clone();
        this.rightHand.scale.x = -1;
        this.rightHand.name = "rightHand";
        this.rightHand.onCollision = (collider) => {
        };
        this.rightHand.onCollisionEnd = (collider) => {
        };
        this.hands.push(this.rightHand);
        this.scene.add(this.rightHand);
    }

    #initDrums() {
        const drumConfigs = [
            { position: [-0.75, 1, -2], color: 0xFF0000, sound: 'snare' },
            { position: [0.75, 1, -2], color: 0x00FF00, sound: 'kick' },
            { position: [-2.5, 1, -3], color: 0x0000FF, sound: 'crash' },
            { position: [2.5, 1, -3], color: 0xFFFF00, sound: 'hihat' },
        ];

        drumConfigs.forEach(({ position, color, sound }) => {
            const drum = this.#createDrum(0.5, 0.1, 0.1, sound);
            drum.position.set(...position);
            drum.outer.material.color.set(color);
            this.drums.set(sound, drum);
            this.scene.add(drum);
        });
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
        drum.name = sound;
        drum.notes = [];
        drum.onCollision = (collider) => {
            if (collider.name === ("leftHand" || "rightHand")) {
                this.audio.playSound(drum.sound);
            }
        };
        drum.onCollisionEnd = (collider) => {
        }
        return drum;
    }

    initNote(position, drum) {
        const note = this.noteModel.clone(true);
        note.drum = drum;
        note.name = drum.name;
        note.position.set(...position);
        note.scale.set(2, 2, 2);
        note.onCollision = (collider) => {
        };
        note.onCollisionEnd = (collider) => {
            console.log(this.score);
            note.destroy();

        };
        note.destroy = () => {
            note.drum.notes = note.drum.notes.filter(otherNotes => otherNotes.id !== note.id);
            this.scene.remove(note);
            note.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    if (child.material) {
                        child.material.dispose();
                    }
                }
            });
        }
        return note;
    }

    createQuaternion(x, y, z, w) {
        return new THREE.Quaternion(x, y, z, w);
    }

    update(deltaTime) {
        // Hand and Drum
        if (this.hands && this.drums) {
            this.hands.forEach(hand => {
                this.drums.forEach(drum => {
                    const handOnDrum = this.#checkCollision(hand, drum);
                    if (handOnDrum) {
                        drum.notes.forEach(note => {
                            const drumHasNote = this.#checkCollision(drum, note);
                            if (drumHasNote) {
                                console.log("hit!");
                                note.destroy();
                            }
                        });
                    }
                });
            });
        }

        // Drum and Note 
        if (this.drums) {
            this.drums.forEach((drum, drumName) => {
                if (drum.notes) {
                    drum.notes.forEach(note => {
                        this.#checkCollision(drum, note);
                        note.position.y -= deltaTime * 0.002
                    });
                }
            });
        }
    }


    #checkCollision(object1, object2) {
        const box1 = new THREE.Box3().setFromObject(object1);
        const box2 = new THREE.Box3().setFromObject(object2);

        const collides = box1.intersectsBox(box2);
        // unique key to avoid circular onCollision / onCollisionEnd activation.
        const key = object1.uuid + "" + object2.uuid;

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
        return collides;
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}