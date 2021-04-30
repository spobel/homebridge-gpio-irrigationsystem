import {AccessoryPlugin, API, APIEvent, Logging, StaticPlatformPlugin} from "homebridge";

import {Config, SystemConfig} from "./config_types";
import {GpioIrrigationSystemAccessory} from "./accessories/irrigationsystem";

export class GpioIrrigationSystemPlatform implements StaticPlatformPlugin {

    private accessoryPlugins: AccessoryPlugin[] = [];

    constructor(public readonly log: Logging, public readonly config: Config, public readonly api: API) {
        config.systems.forEach(this.addSystem.bind(this))
        this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => {});
    }

    addSystem(system: SystemConfig) {
        this.accessoryPlugins.push(new GpioIrrigationSystemAccessory(this.log, system));
    }

    accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
        callback(this.accessoryPlugins);
    }

}
