export default class Score {
    constructor() {
        this.combo = 0;
        this.score = 0;
        this.earlyValue = 0;
        this.perfectValue = 0;
        this.lateValue = 0;
        this.early = 0;
        this.perfect = 0;
        this.late = 0;
        this.accuracy = 0;
    }

    init() {
        this.combo = 0;
        this.score = 0;
        this.earlyValue = 100;
        this.perfectValue = 300;
        this.lateValue = 100;
    }

    processHit(hit) {
        switch (hit) {
            case ("early"):
                this.early++
                this.combo++;
                this.increaseScore(this.earlyValue);
                break;

            case ("perfect"):
                this.perfect++
                this.combo++;
                this.increaseScore(this.perfectValue);
                break;

            case ("late"):
                thislate++
                this.combo++;
                this.increaseScore(this.lateValue);
                break;

            case ("miss"):
                this.miss++
                this.resetCombo();
                break;
        }
    }

    calculateAccuracy() {
        const totalHits = this.perfect + this.early + this.late + this.miss;
        if (totalHits === 0) {
            return 0;
        }
        this.accuracy = ((100 * this.perfect) + (33 * this.early) + (33 * this.late)) / totalHits;
        return accuracy;
    }

    increaseScore(hitValue) {
        this.score += hitValue * this.combo;
        return this.score;
    }

    resetCombo() {
        this.combo = 0;r
        return this.combo;
    }

    resetAll() {
        this.score = 0;
        this.early = 0;
        this.perfect = 0;
        this.late = 0;
        this.miss = 0;
        this.accuracy = 0;
    }
}