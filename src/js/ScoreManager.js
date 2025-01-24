export default class ScoreManager {
    constructor() {
        this.earlyValue = 0;
        this.goodValue = 0;
        this.lateValue = 0;

        this.accuracy = 0;
        this.combo = 0;
        this.points = 0;

        this.early = 0;
        this.good = 0;
        this.late = 0;
        this.miss = 0;

        this.maxCombo = 0;
        this.totalHits = 0;
    }

    init() {
        this.accuracy = 100;
        this.earlyValue = 100;
        this.goodValue = 300;
        this.lateValue = 100;
    }

    processHit(hit) {
        switch (hit) {
            case ("early"):
                this.early++
                this.increaseCombo();
                this.increasePoints(this.earlyValue);
                this.calculateAccuracy();
                break;

            case ("good"):
                this.good++
                this.increaseCombo();
                this.increasePoints(this.goodValue);
                this.calculateAccuracy();
                break;

            case ("late"):
                this.late++
                this.increaseCombo();
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
        this.totalHits = this.early + this.good + this.late + this.miss;

        if (this.good + this.early + this.late === 0) {
            this.accuracy = 0;
        }
        else {
            this.accuracy = ((100 * this.good) + (33 * this.early) + (33 * this.late)) / this.totalHits;
            this.accuracy = this.accuracy.toFixed(2);
        }
    }

    increasePoints(hitValue) {
        if (this.combo != 0) {
            this.points += hitValue * this.combo;
        }
        if (this.combo === 0) {
            this.points += hitValue;
        }
    }

    increaseCombo(){
        this.combo++;
        if  (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
    }

    resetCombo() {
        if (this.combo > this.maxCombo){
            this.maxCombo = this.combo;
        }
        this.combo = 0;
    }

    getScoreData(){
        const scoreData ={
            points: this.points,
            combo: this.maxCombo,
            accuracy: this.accuracy,
            early: this.early,
            good: this.good,
            late: this.late,
            miss: this.miss,
        }
        return scoreData;
    }

    resetAll() {
        this.points = 0;
        this.combo = 0;
        this.early = 0;
        this.good = 0;
        this.late = 0;
        this.miss = 0;
        this.accuracy = 100;
        this.totalHits = 0;
    }

    getAccuracy() {
        return this.accuracy;
    }

    getCombo() {
        return this.combo;
    }

    getPoints() {
        return this.points;
    }
}