export default class ScoreManager {
    constructor() {
        this.earlyValue = 0;
        this.perfectValue = 0;
        this.lateValue = 0;

        this.accuracy = 0;
        this.combo = 0;
        this.points = 0;
        this.early = 0;
        this.perfect = 0;
        this.late = 0;
        this.totalHits = 0;
    }

    init() {
        this.accuracy = 100;
        this.earlyValue = 100;
        this.perfectValue = 300;
        this.lateValue = 100;
    }

    processHit(hit) {
        switch (hit) {
            case ("early"):
                this.early++
                this.combo++;
                this.increasePoints(this.earlyValue);
                this.calculateAccuracy();
                break;

            case ("perfect"):
                this.perfect++
                this.combo++;
                this.increasePoints(this.perfectValue);
                this.calculateAccuracy();
                break;

            case ("late"):
                this.thislate++
                this.combo++;
                this.increasePoints(this.lateValue);
                this.calculateAccuracy();
                break;

            case ("miss"):
                this.miss++
                this.resetCombo();
                this.calculateAccuracy();
                break;
        }
    }

    calculateAccuracy() {
        this.totalHits = this.perfect + this.early + this.late + this.miss;
        if (this.totalHits === 0) {
            this.accuracy = 0;
        }
        this.accuracy = ((100 * this.perfect) + (33 * this.early) + (33 * this.late)) / this.totalHits;
    }

    increasePoints(hitValue) {
        this.points += hitValue * this.combo;
    }

    resetCombo() {
        this.combo = 0;
    }

    resetAll() {
        this.points = 0;
        this.combo = 0;
        this.early = 0;
        this.perfect = 0;
        this.late = 0;
        this.miss = 0;
        this.accuracy = 100;
        this.totalHits = 0;
    }
}