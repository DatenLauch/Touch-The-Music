export default class NoteReader {
  constructor(three, track) {
    this.three = three;
    this.track = track;
    this.drumsMap = three.drums;
    this.bpm = null;
    this.signature = {};
    this.notesByBeat = {};
    this.notesByTime = {};
    this.notesByTimeRemaining = {};
    this.startTime = null;
    this.noteFallHeight = null;
    this.isRunning = false;
    this.isPaused = false;
    this.pauseStart = 0;
    this.totalPausedDuration = 0;
  }

  async init() {
    this.noteFallHeight = 10;
    document.addEventListener('visibilitychange', this.#onVisibilityChange.bind(this));
    this.loadTrack(this.track);
    this.start();
  }

  #onVisibilityChange() {
    if (document.hidden) {
      this.pause(); 
    } else {
      this.resume(); 
    }
  }

  loadTrack(track) {
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
    this.startTime = performance.now();
    this.isRunning = true;
    this.isPaused = false;
  }

  pause() {
    if (!this.isPaused) {
      this.isPaused = true;
      this.isRunning = false
      this.pauseStart = performance.now();
    }
  }

  resume() {
    if (this.isPaused) {
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
    }
  }

  spawnNote(instrument) {
    const drum = this.drumsMap.get(instrument);
    const x = drum.position.x;
    const y = drum.position.y + this.noteFallHeight;
    const z = drum.position.z;
    const position = [x, y, z];
    const note = this.three.initNote(position, drum);
    drum.notes.push(note);
    this.three.scene.add(note);
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