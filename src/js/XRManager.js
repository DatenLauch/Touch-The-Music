export default class XRManager {

    constructor(threeManager, uiManager, noteManager) {
        this.threeManager = threeManager;
        this.uiManager = uiManager;
        this.noteManager = noteManager;
        this.session = null;
        this.previousTime = 0;
        this.inputSources = [];
        this.referenceSpace = null;
        this.hasStarted = false;
    }

    async initAR() {
        try {
            this.session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['bounded-floor', 'plane-detection', 'hit-test', 'anchors', 'hand-tracking']
            });
            await this.#initSession();
            this.threeManager.scene.remove(this.threeManager.skybox);
        }
        catch (error) {
            console.error('Error initializing AR session:', error);
        }
    }

    async initVR() {
        try {
            this.session = await navigator.xr.requestSession('immersive-vr', {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['bounded-floor', 'viewer', 'hand-tracking']
            });
            await this.#initSession();
        }
        catch (error) {
            console.error('Error initializing VR session:', error);
        }
    }

    async #initSession() {
        this.threeManager.renderer.xr.enabled = true;
        await this.threeManager.renderer.xr.setSession(this.session);
        this.referenceSpace = await this.session.requestReferenceSpace('local-floor');
        this.session.addEventListener('end', this.#onSessionEnded.bind(this));
        this.session.addEventListener('inputsourceschange', this.#onInputSourcesChange.bind(this));
        this.noteManager.start();
        this.session.requestAnimationFrame(this.update.bind(this));
    }

    async #onSessionEnded(event) {
        this.session.removeEventListener('inputsourceschange', this.#onInputSourcesChange);
        this.session.removeEventListener('end', this.#onSessionEnded);
        this.session = null;
        await this.threeManager.renderer.xr.setSession(null);
        console.log("XR Session ended: " + event);
    }

    #onInputSourcesChange(event) {
        event.added.forEach(inputSource => {
            const source = inputSource;
            this.inputSources.push(source);
        });
        event.removed.forEach(inputSource => {
            this.inputSources = this.inputSources.filter(source => source !== inputSource);
        });
    }

    update(time, frame) {
        const deltaTime = time - this.previousTime;
        this.previousTime = time;

        this.inputSources.forEach(inputSource => {
            if (inputSource.hand && frame) {
                this.#updateHands(inputSource, frame);
            }
        });

        this.threeManager.update(deltaTime);
        this.noteManager.update(deltaTime);
        this.uiManager.update(deltaTime);
        this.threeManager.render();
        this.session.requestAnimationFrame(this.update.bind(this));
    }

    #updateHands(inputSource, frame) {
        const hand = inputSource.hand;
        const handedness = inputSource.handedness;

        if (handedness === 'right') {
            let wristJoint = hand.get('wrist');
            let palmOffset = 0.15;
            let wristPose = frame.getJointPose(wristJoint, this.referenceSpace);

            this.threeManager.rightHand.position.x = wristPose.transform.position.x;
            this.threeManager.rightHand.position.y = wristPose.transform.position.y;
            this.threeManager.rightHand.position.z = wristPose.transform.position.z - palmOffset;

            const rotation = wristPose.transform.orientation;
            const quaternion = this.threeManager.createQuaternion(rotation.x, rotation.y, rotation.z, rotation.w);
            this.threeManager.rightHand.rotation.setFromQuaternion(quaternion);
        }

        if (handedness === 'left') {
            let wristJoint = hand.get('wrist');
            let palmOffset = 0.15;
            let wristPose = frame.getJointPose(wristJoint, this.referenceSpace);

            this.threeManager.leftHand.position.x = wristPose.transform.position.x;
            this.threeManager.leftHand.position.y = wristPose.transform.position.y;
            this.threeManager.leftHand.position.z = wristPose.transform.position.z - palmOffset;

            const rotation = wristPose.transform.orientation;
            const quaternion = this.threeManager.createQuaternion(rotation.x, rotation.y, rotation.z, rotation.w);
            this.threeManager.leftHand.rotation.setFromQuaternion(quaternion);
        }

        const indexFinger = hand.get('index-finger-tip');
        const thumb = hand.get('thumb-tip');
        if (thumb && indexFinger) {
            const distance = 1;
            if (distance < 0.05) {
                console.log('Pinch gesture');
            }
        }
    }
}