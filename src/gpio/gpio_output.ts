import {BinaryValue, Gpio} from "onoff";
import {VirtualGpio} from "./gpio_virtual";
import {GPIO} from "./gpio_interface";

export class GpioOutput {

    private gpio: GPIO;
    private readonly voltageOn;
    private readonly voltageOff;

    constructor(private readonly log: (message: string) => void,
                private readonly pin: number,
                invertHighLow: boolean) {
        this.gpio = Gpio.accessible && process.platform !== "darwin" ? new Gpio(this.pin, "out") : new VirtualGpio(this.pin);
        this.voltageOn = invertHighLow ? Gpio.LOW : Gpio.HIGH;
        this.voltageOff = invertHighLow ? Gpio.HIGH : Gpio.LOW;
        this.off(() => this.log("GPIO initialized"));
    }

    on(callback: () => void) {
        this.write(this.voltageOn, "on", callback);
    }

    off(callback: () => void) {
        this.write(this.voltageOff, "off", callback);
    }

    private write(value: BinaryValue, message: "on" | "off", onOk: () => void) {
        this.gpio.write(value, (err) => this.callbackHandler(err, onOk, message, value));
    }

    private callbackHandler(err, onOk, message, value) {
        if (err) {
            this.log("error by turn GPIO " + this.pin + " " + message + ", (voltage " + value + "), due to " + err);
        } else {
            this.log("turned GPIO " + this.pin + " " + message + ", (voltage " + value + ")");
            onOk();
        }
    }

}
