import * as THREE from 'three';
export default class ThreeManager {
    constructor(uiManager, audioManager, scoreManager, gltfLoader, difficultySettings) {
        this.uiManager = uiManager
        this.audioManager = audioManager;
        this.scoreManager = scoreManager;
        this.gltfLoader = gltfLoader;
        this.difficultySettings = difficultySettings;

        this.fallSpeed = this.difficultySettings.fallSpeed;
        this.hitLeniency = this.difficultySettings.hitLeniency;
        this.renderer = null;
        this.camera = null;
        this.scene = null;
        this.hud = null;
        this.directionalLight = null;
        this.ambientLight = null;
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
        this.camera.position.set(0, 1.8, 0);

        this.scene = new THREE.Scene();

        this.ambientLight = new THREE.AmbientLight(0xffffff)
        this.scene.add(this.ambientLight);
        this.directionalLight = new THREE.DirectionalLight(0xffffff);
        this.directionalLight.castShadow = true;
        this.directionalLight.position.set(1, 1, 1).normalize();
        this.scene.add(this.directionalLight);

        this.handModel = await this.#loadGLTFModel('src/assets/models/hand/hand.gltf');
        this.#initHands();

        this.noteModel = await this.#loadGLTFModel('src/assets/models/note/note.gltf');
        this.#initDrums();
        this.#initHUD();
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

    #initHUD() {
        const accuracyData = this.scoreManager.getAccuracy();
        const accuracyText = this.uiManager.createText("ACCURACY\n" + accuracyData);
        accuracyText.position.set(1, 0.8, 0);

        const comboData = this.scoreManager.getCombo()
        const comboText = this.uiManager.createText("COMBO\n" + comboData);
        comboText.position.set(-1, 0.8, 0);

        const pointsData = this.scoreManager.getPoints()
        const pointsText = this.uiManager.createText("SCORE\n" + pointsData);
        pointsText.position.set(0, 0.8, 0);

        this.hud = new THREE.Group();
        this.hud.accuracyText = accuracyText;
        this.hud.comboText = comboText;
        this.hud.pointsText = pointsText;
        this.hud.add(accuracyText);
        this.hud.add(comboText);
        this.hud.add(pointsText);
        this.scene.add(this.hud);
    }

    async #loadGLTFModel(path) {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
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
            { position: [-0.55, 1.2, -1.75], color: 0x000000, sound: 'snare' },
            { position: [0.55, 1.2, -1.75], color: 0x000000, sound: 'kick' },
            { position: [-1.25, 1.2, -1], color: 0x000000, sound: 'crash' },
            { position: [1.25, 1.2, -1], color: 0x000000, sound: 'hihat' },
        ];

        drumConfigs.forEach(({ position, color, sound }) => {
            const drum = this.#createDrum(0.3, 0.2, 0.1, sound);
            drum.position.set(...position);
            drum.outer.material.color.set(color);
            this.drums.set(sound, drum);
            this.scene.add(drum);
            drum.lookAt(0,0,0);
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

        const hitSplash = this.uiManager.createText("");
        hitSplash.position.set(0, height / 2 + 0.001, height * 2 - 0.05);
        hitSplash.lookAt(0, 5, (height * 2 + 0.2)); 

        const drum = new THREE.Group();
        drum.hitSplash = hitSplash;
        drum.outer = outer;
        drum.middle = middle;
        drum.name = sound;
        drum.notes = [];
        drum.add(outer);
        drum.add(middle);
        drum.add(hitSplash);
        drum.onCollision = (collider) => {
            if ((collider.name === "leftHand" || collider.name === "rightHand")) {
                this.audioManager.playSound(drum.name);
            }
        };
        drum.onCollisionEnd = (collider) => {
        }
        return drum;
    }

    initNote(position, drum) {
        let note = this.noteModel.clone(true);
        note.drum = drum;
        note.name = "note";
        note.position.set(...position);
        note.boundingBox = this.#extendBoundingBoxDownwards(note);
        //note.helper = new THREE.Box3Helper(note.boundingBox, 0xff0000);
        //this.scene.add(note.helper);

        note.onCollision = (collider) => {
        };
        note.onCollisionEnd = (collider) => {
            this.#displayHitSplash(note.drum, "miss");
            this.scoreManager.processHit("miss");
            note.destroy();
        };
        note.destroy = () => {
            note.drum.notes = note.drum.notes.filter(otherNotes => otherNotes.id !== note.id);
            //this.scene.remove(note.helper);
            this.scene.remove(note);
            note.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    if (child.material) {
                        child.material.dispose();
                    }
                }
            });
            note.onCollision = null;
            note.onCollisionEnd = null;
            note.boundingBox = null;
            //note.helper = null;
            note.drum = null;
            note.name = null;
            note = null;
        }
        return note;
    }

    #displayHitSplash(drum, hit) {
        //drum.hitSplash.lookAt(this.camera.position);
        switch (hit) {
            case "early":
                drum.hitSplash.text.set({
                    content: "EARLY",
                    //fontColor: new THREE.Color(0xFFFF00),
                });
                drum.outer.material.color.set(new THREE.Color(0xFFFF00));
                break;

            case "perfect":
                drum.hitSplash.text.set({
                    content: "GOOD",
                    //fontColor: new THREE.Color(0x00FF00),
                });
                drum.outer.material.color.set(new THREE.Color(0x00FF00));
                break;

            case "late":
                drum.hitSplash.text.set({
                    content: "LATE",
                    //fontColor: new THREE.Color(0xFFFF00),
                });
                drum.outer.material.color.set(new THREE.Color(0x0000FF));
                break;

            case "miss":
                drum.hitSplash.text.set({
                    content: "MISS",
                    //fontColor: new THREE.Color(0xFF0000),
                });
                drum.outer.material.color.set(new THREE.Color(0xFF0000));
                break;
        }
    }

    createQuaternion(x, y, z, w) {
        return new THREE.Quaternion(x, y, z, w);
    }

    #extendBoundingBoxDownwards(object) {
        const boundingBox = new THREE.Box3().setFromObject(object);
        const objectHeight = boundingBox.max.y - boundingBox.min.y;
        boundingBox.max.y += objectHeight / 2; // maybe div by 2?
        boundingBox.min.y -= objectHeight / 2; // maybe div by 2?
        return boundingBox;
    }

    update(deltaTime) {
        // Check if any hand touches a drum and if that drum also happens to have a note on it
        if (this.hands && this.drums) {
            this.hands.forEach(hand => {
                this.drums.forEach(drum => {
                    const handOnDrum = this.#checkCollision(hand, drum);
                    if (handOnDrum) {
                        drum.notes.forEach(note => {
                            const noteOnDrum = this.#checkCollision(note, drum);
                            if (noteOnDrum) {
                                const positionDifference = note.position.y - drum.position.y;
                                if (Math.abs(positionDifference) < this.hitLeniency) {
                                    this.scoreManager.processHit("perfect");
                                    this.#displayHitSplash(drum, "perfect");
                                    note.destroy();
                                    return;
                                }
                                else if (positionDifference > 0) {
                                    this.scoreManager.processHit("early");
                                    this.#displayHitSplash(drum, "early");
                                    note.destroy();
                                    return;
                                }
                                else if (positionDifference < 0) {
                                    this.scoreManager.processHit("late");
                                    this.#displayHitSplash(drum, "late");
                                    note.destroy();
                                    return;
                                }
                            }
                        });
                    }
                });
            });
        }


        if (this.drums) {
            this.drums.forEach((drum, drumName) => {
                if (drum.notes) {
                    drum.notes.forEach(note => {
                        this.#checkCollision(note, drum);
                        note.position.y -= deltaTime * this.fallSpeed;
                    });
                }
            });
        }
        this.#updateHUDPosition();
        this.#updateHUDData();
    }

    #updateHUDData(){
        const accuracyData = this.scoreManager.getAccuracy();
        this.hud.accuracyText.text.set({
            content: "ACCURACY\n" + accuracyData+ "%",
        });

        const comboData = this.scoreManager.getCombo();
        this.hud.comboText.text.set({
            content: "COMBO\n" + comboData,
        });

        const pointsData = this.scoreManager.getPoints();
        this.hud.pointsText.text.set({
            content: "SCORE\n" + pointsData,
        });

        

    }

    #updateHUDPosition() {
        const cameraWorldPosition = new THREE.Vector3();
        this.camera.getWorldPosition(cameraWorldPosition);
    
        const hudDistance = 1; 
        const hudPosition = new THREE.Vector3(0, 0, -hudDistance);
        hudPosition.applyQuaternion(this.camera.quaternion);
    
        this.hud.position.copy(cameraWorldPosition).add(hudPosition); 
        this.hud.quaternion.copy(this.camera.quaternion);
    }


    #checkCollision(object1, object2) {
        let box1;
        if (object1.name === "note") {
            box1 = this.#extendBoundingBoxDownwards(object1);
            object1.boundingBox = box1;
            //object1.helper.box.copy(box1);
        }
        else {
            box1 = new THREE.Box3().setFromObject(object1);
        }
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