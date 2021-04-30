import {BinaryValue} from "onoff";

export interface GPIO {

    write(value: BinaryValue, callback?: (err: (Error | null | undefined)) => void): Promise<void> | void;

}
