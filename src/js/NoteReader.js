export default class NoteReader {

  constructor(bpm, signature, notes) {
    this.bpm = bpm;
    this.signature = signature
    this.notesByBeat = notes;
    this.notesByTime = {};
    this.notesByTimeRemaining = {};
    this.startTime = null;
  }

  async init() {
    this.startTime = performance.now();
    const beatDuration = this.calculateBeatDuration(this.bpm);
    this.notesByTime = this.convertNotes(beatDuration, this.notesByBeat);
    this.notesByTimeRemaining = structuredClone(this.notesByTime);
    console.log(this.notesByBeat);
    console.log(this.notesByTime);
  }

  // function converts notes from beat notation into milliseconds based on bpm
  convertNotes(beatDuration, notes) {
    const notesByTime = {};
      for (const instrument in notes) {
        notesByTime[instrument] = notes[instrument].map(beat =>
          Math.round(beat * beatDuration * 1000) / 1000
        );
      }
      return notesByTime;
    }

  calculateBeatDuration(bpm) {
    const beatDuration = 60000 / bpm;
    if (this.signature.beatType === 8) {
      return beatDuration / 2;
    }
    return beatDuration;
  }

  // the 10 milliseconds are process leniency
  processNotes() {
    const elapsedTime = performance.now() - this.startTime;
    let hasNotesRemaining = false;

    for (const instrument in this.notesByTimeRemaining) {
      const remainingTimes = this.notesByTimeRemaining[instrument];
      if (remainingTimes.length > 0) {
        const nextNoteTime = remainingTimes[0];
        if (Math.abs(elapsedTime - nextNoteTime) < 10) {
          this.playSound(instrument);
          this.notesByTimeRemaining[instrument].shift();
        }
      }
    }
    if (Object.values(this.notesByTimeRemaining).every(notes => notes.length === 0)) {
      this.stop();
    }
  }

  playSound(instrument) {
    console.log(instrument + "hit!");
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    console.log("end!");
  }

  update(deltaTime) {
    this.processNotes();
  }
}