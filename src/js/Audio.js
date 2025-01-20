import * as THREE from 'three';

export default class Audio {
    constructor() {
        this.listener = null;
        this.loader = null;
        this.urls = {
            hihat: 'src/assets/sounds/hihat.wav',
            snare: 'src/assets/sounds/snare.wav',
            kick: 'src/assets/sounds/kick.wav',
            crash: 'src/assets/sounds/crash.wav'
        };
        this.sounds = {};
    }

    async init() {
        this.listener = new THREE.AudioListener();
        this.loader = new THREE.AudioLoader();
        try {
            for (let name in this.urls) {
                const url = this.urls[name];
                const sound = await this.loadSound(url);
                this.sounds[name] = sound;
            }
        } catch (error) {
            console.error("Error loading sounds:", error);
        }
    }

    async loadSound(url) {
        return new Promise((resolve, reject) => {
            this.loader.load(url, (buffer) => {
                const sound = new THREE.Audio(this.listener);
                sound.setBuffer(buffer);
                sound.setLoop(false);
                resolve(sound);
            }, undefined, (error) => {
                reject(error);
            });
        });
    }

    playSound(name) {
        const sound = this.sounds[name];
        if (sound) {
            if (sound.isPlaying) {
                sound.stop();
            }
            sound.play();
        } else {
            console.error(name + " sound is not loaded");
        }
    }

    stopSound(name) {
        const sound = this.sounds[name];
        if (sound) {
            sound.stop();
        } else {
            console.error(name + "sound is not playing");
        }
    }
}