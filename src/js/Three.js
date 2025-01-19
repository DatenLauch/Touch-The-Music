import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default class Three {
    constructor() {
        this.renderer = null;
        this.camera = null;
        this.scene = null;
        this.directionalLight = null;
        this.ambientLight = null;
        this.cube = null;
        this.gltfloader = null;
    }

    async init() {
        this.renderer = this.#initRenderer();
        document.body.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.5, 2);

        this.scene = new THREE.Scene();

        this.ambientLight = new THREE.AmbientLight(0xffffff)
        this.scene.add(this.ambientLight);
        this.directionalLight = new THREE.DirectionalLight(0xffffff);
        this.directionalLight.castShadow = true;
        this.directionalLight.position.set(1, 1, 1).normalize();
        this.scene.add(this.directionalLight);

        this.gltfloader = new GLTFLoader();
        await this.loadHands('src/assets/models/hand/hand.gltf');



        this.cube = this.#createTestCube();
        //this.cube.position.set(0, 2, -5);
        this.cube.position.set(0, 2, 0);
        this.cube.scale.set(0.1, 0.1, 0.1);
        this.scene.add(this.cube);

        /*this.scene.inputRenderer.setControllerMesh(new Gltf2Node({url: 'media/gltf/controller/controller.gltf'}), 'right');
        this.scene.inputRenderer.setControllerMesh(new Gltf2Node({url: 'media/gltf/controller/controller-left.gltf'}), 'left');*/

        window.addEventListener('resize', this.#onWindowResize.bind(this));
    }

    async loadHands(path) {
        this.gltfloader.load(
            path,
            (gltf) => {
                const model = gltf.scene;
                this.leftHand = model;
                this.scene.add(this.leftHand);

                const mirroredModel = model.clone(); // Clone the model to avoid modifying the original
                mirroredModel.scale.x = -1;
                this.rightHand = mirroredModel;
                this.scene.add(this.rightHand);
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('An error happened while loading the model:', error);
                reject(error);
            }
        );
    }

    #initRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        return renderer;
    }

    #onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    #createTestCube() {
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        cube.castShadow = true;
        cube.receiveShadow = true;
        return cube;
    }

    createQuaternion(x, y, z, w) {
        return new THREE.Quaternion(x, y, z, w);
    }


    update(deltaTime) {
        if (this.cube) {
            this.cube.rotation.y += 0.002 * deltaTime;
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}