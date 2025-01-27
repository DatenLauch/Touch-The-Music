export default class NoteManager {
  constructor() {
    this.three = null;
    this.track = {};
    this.bpm = null;
    this.signature = {};
    this.notesByBeat = {};
    this.notesByTime = {};
    this.notesByTimeRemaining = {};
    this.startTime = null;
    this.noteSpawnHeight = null;
    this.hasStarted = false;
    this.isRunning = false;
    this.isPaused = false;
    this.pauseStart = 0;
    this.totalPausedDuration = 0;
    this.timeOut = 0;
  }

  setThree(three){
    this.three = three;
  }

  init() {
    this.timeOut = 5000;
    this.noteSpawnHeight = 1;
    document.addEventListener('visibilitychange', this.#onVisibilityChange.bind(this));
  }

  #onVisibilityChange() {
    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  }

  loadTrack(track) {
    this.track = track;
    this.bpm = track.bpm;
    this.signature = track.signature;
    this.notesByBeat = track.notes;
    this.#convertTrack();
  }

  #convertTrack() {
    const beatDuration = this.#calculateBeatDuration(this.bpm);
    this.notesByTime = this.#convertNotes(beatDuration, this.notesByBeat);
    this.notesByTimeRemaining = structuredClone(this.notesByTime);
  }

  start() {
    this.notesByTimeRemaining = structuredClone(this.notesByTime);
    this.startTime = performance.now();
    this.hasStarted = true;
    this.isRunning = true;
    this.isPaused = false;
  }

  pause() {
    if (!this.isPaused && this.hasStarted) {
      this.isPaused = true;
      this.isRunning = false
      this.pauseStart = performance.now();
    }
  }

  resume() {
    if (this.isPaused && this.hasStarted) {
      this.isPaused = false;
      this.isRunning = true
      this.totalPausedDuration += performance.now() - this.pauseStart;
    }
  }

  // converts notes from beat notation into milliseconds based on bpm
  #convertNotes(beatDuration, notes) {
    const notesByTime = {};
    for (const instrument in notes) {
      notesByTime[instrument] = notes[instrument].map(beat =>
        Math.round(beat * beatDuration * 1000) / 1000
      );
    }
    return notesByTime;
  }

  #calculateBeatDuration(bpm) {
    const beatDuration = 60000 / bpm;
    if (this.signature.beatType === 8) {
      return beatDuration / 2;
    }
    return beatDuration;
  }

  processNotes() {
    if (this.isRunning) {
      const currentTime = performance.now();
      const elapsedTime = currentTime - this.startTime - this.totalPausedDuration;

      for (const instrument in this.notesByTimeRemaining) {
        const remainingTimes = this.notesByTimeRemaining[instrument];
        if (remainingTimes.length > 0) {
          const nextNoteTime = remainingTimes[0];
          if (elapsedTime - nextNoteTime >= 0) {
            this.spawnNote(instrument);
            this.notesByTimeRemaining[instrument].shift();
          }
        }
      }
      if (Object.values(this.notesByTimeRemaining).every(notes => notes.length === 0)) {
        this.stop();
        setTimeout(() => {
          this.three.end();
        }, this.timeOut); 
      }
    }
  }

  spawnNote(instrument) {
    if (this.three.drums) {
      const drum = this.three.drums.get(instrument);
      const x = drum.position.x;
      const y = drum.position.y + this.noteSpawnHeight;
      const z = drum.position.z;
      const position = [x, y, z];
      const note = this.three.initNote(position, drum);
      drum.notes.push(note);
      this.three.scene.add(note);
    }
    else (stop());
  }

  stop() {
    this.isRunning = false;
    console.log("stop");
  }

  update(deltaTime) {
    if (this.isRunning && !this.isPaused) {
      this.processNotes();
    }
  }
}