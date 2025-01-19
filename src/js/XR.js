export default class XR {

    constructor(three) {
        this.three = three;
        this.session = null;
        this.previousTime = 0;
        this.inputSources = [];
        this.referenceSpace = null;
    }

    async initAR() {
        try {
            this.session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['bounded-floor', 'plane-detection', 'hit-test', 'anchors', 'hand-tracking']
            });
            await this.#initSession();
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
        this.three.renderer.xr.enabled = true;
        await this.three.renderer.xr.setSession(this.session);
        this.referenceSpace = await this.session.requestReferenceSpace('local-floor');
        this.session.addEventListener('end', this.#onSessionEnded.bind(this));
        this.session.addEventListener('inputsourceschange', this.#onInputSourcesChange.bind(this));
    }

    async #onSessionEnded(event) {
        this.session.removeEventListener('inputsourceschange', this.#onInputSourcesChange);
        this.session.removeEventListener('end', this.#onSessionEnded);
        this.session = null;
        await this.three.renderer.xr.setSession(this.session);
        this.three.renderer.xr.enabled = false;
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

    update(deltaTime, frame) {
        if (!this.session || !frame) return;

        this.inputSources.forEach(inputSource => {
            if (inputSource.hand) {
                this.#updateHands(inputSource, frame);
            }
        });
    }

    #updateHands(inputSource, frame) {
        const hand = inputSource.hand;
        const handedness = inputSource.handedness;

        if (handedness === 'right') {
            let joint = hand.get('index-finger-tip');
            let jointPose = frame.getJointPose(joint, this.referenceSpace);
            this.three.rightHand.position.x = jointPose.transform.position.x;
            this.three.rightHand.position.y = jointPose.transform.position.y;
            this.three.rightHand.position.z = jointPose.transform.position.z;
        }

        if (handedness === 'left') {
            let joint = hand.get('index-finger-tip');
            let jointPose = frame.getJointPose(joint, this.referenceSpace);
            this.three.leftHand.position.x = jointPose.transform.position.x;
            this.three.leftHand.position.y = jointPose.transform.position.y;
            this.three.leftHand.position.z = jointPose.transform.position.z;
            /*
            const rotation = jointPose.transform.orientation;
            const quaternion = this.three.createQuaternion(rotation.x, rotation.y, rotation.z, rotation.w);
            this.three.leftHand.rotation.setFromQuaternion(quaternion); */
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