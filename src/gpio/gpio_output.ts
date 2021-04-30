import {BinaryValue, Gpio} from "onoff";
import {VirtualGpio} from "./gpio_virtual";
import {GPIO} from "./gpio_interface";

export class GpioOutput {

    private gpio: GPIO;

    constructor(public readonly log: (message: string) => void, public readonly pin: number, public readonly invertHighLow: boolean) {
        if (Gpio.accessible && process.platform !== "darwin") {
            this.gpio = new Gpio(this.pin, "out");
        } else {
            this.gpio = new VirtualGpio(this.pin);
        }
        this.off(() => this.log("GPIO initialized"));
    }

    on(onOk: () => void) {
        const voltage = this.invertHighLow ? Gpio.LOW : Gpio.HIGH;
        this.write(voltage, "on", onOk);
    }

    off(onOk: () => void) {
        const voltage = this.invertHighLow ? Gpio.HIGH : Gpio.LOW;
        this.write(voltage, "off", onOk);
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
