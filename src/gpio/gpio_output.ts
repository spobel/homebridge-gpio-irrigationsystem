//import {Gpio} from "onoff";
import {Gpio} from "./gpio_debugger";
import {Logger} from "homebridge";

export class GpioOutput {

    private readonly log: Logger;

    private readonly pin: number;
    private readonly invertHighLow: boolean;

    private gpio: Gpio;

    constructor(log: Logger, pin: number, invertHighLow: boolean) {
        this.log = log;
        this.pin = pin;
        this.invertHighLow = invertHighLow;

        this.gpio = new Gpio(this.pin, "out");
        this.off();
    }

    on() {
        const voltage = this.invertHighLow ? Gpio.LOW : Gpio.HIGH;
        this.log.info("turn GPIO %d on, (voltage %d)", this.pin, voltage);
        this.gpio.writeSync(voltage);
    }

    off() {
        const voltage = this.invertHighLow ? Gpio.HIGH : Gpio.LOW;
        this.log.info("turn GPIO %d off, (voltage %d)", this.pin, voltage);
        this.gpio.writeSync(voltage);
    }

}