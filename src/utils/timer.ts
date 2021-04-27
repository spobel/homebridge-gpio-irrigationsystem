export class Timer {

    private readonly startTimestampInMilliseconds = new Date().getTime();
    private readonly timeout;
    private readonly durationInMilliseconds;
    private readonly onStop: () => void;

    constructor(duration: number, onStart: () => void, onStop: () => void) {
        this.durationInMilliseconds = duration * 1000;
        this.onStop = onStop;
        this.timeout = setTimeout(onStop.bind(this), this.durationInMilliseconds);
        onStart();
    }

    interruptTimer(): void {
        clearTimeout(this.timeout);
        this.onStop();
    }

    getRemainingTime(): number {
        return Math.round((this.startTimestampInMilliseconds + this.durationInMilliseconds - new Date().getTime()) / 1000);
    }

}