import {AccessoryPlugin, API, Logging, StaticPlatformPlugin} from "homebridge";

import {Config, System} from "./config_types";
import {GpioIrrigationSystemAccessory} from "./accessories/irrigationsystem";

export class GpioIrrigationSystemPlatform implements StaticPlatformPlugin {

    private accessoryPlugins: AccessoryPlugin[] = [];

    constructor(public readonly log: Logging, config: Config, api: API) {
        config.systems.forEach(this.addSystem.bind(this));
    }

    addSystem(system: System) {
        this.accessoryPlugins.push(new GpioIrrigationSystemAccessory(this.log, system));
    }

    accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
        callback(this.accessoryPlugins);
    }

}