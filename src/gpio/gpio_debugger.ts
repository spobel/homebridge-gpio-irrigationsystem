import {BinaryValue, Direction, High, Low} from "onoff";

export class Gpio {

    static LOW: Low = 0;
    static HIGH: High = 1;

    pin: number;
    direction: Direction;

    constructor(pin: number, direction: Direction) {
        this.pin = pin;
        this.direction = direction;
    }

    writeSync(value: BinaryValue): void {
        console.log("[GPIO DEBUGGER] set %s PIN %d to %d", this.direction, this.pin, value);
    }
}