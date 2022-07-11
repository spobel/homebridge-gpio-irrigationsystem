import {BinaryValue} from "onoff";
import {GPIO} from "./gpio_interface";

export class VirtualGpio implements GPIO {

    constructor(private readonly pin: number) {
    }

    async write(value: BinaryValue, callback?: (err: (Error | null | undefined)) => void): Promise<void> {
        console.log("[VIRTUAL GPIO] set PIN %d to %d", this.pin, value);
        callback?.(undefined);
    }

}
