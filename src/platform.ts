import {AccessoryPlugin, API, Logging, StaticPlatformPlugin} from "homebridge";

import {Config, SystemConfig, ValveConfig} from "./config_types";
import {GpioIrrigationSystemAccessory} from "./accessories/irrigationsystem";
import {GpioValveAccessory} from "./accessories/valve";

export class GpioIrrigationSystemPlatform implements StaticPlatformPlugin {

    private accessoryPlugins: AccessoryPlugin[] = [];

    constructor(public readonly log: Logging, public readonly config: Config, public readonly api: API) {
        config.systems.forEach(this.addSystem.bind(this))
    }

    addSystem(system: SystemConfig) {
        const irrg = new GpioIrrigationSystemAccessory(this.log, system, this.api)
        system.valves.forEach((v, i) => this.initValves(irrg, v, i));
        this.accessoryPlugins.push(irrg);
    }

    initValves(irrg: GpioIrrigationSystemAccessory, valveConfig: ValveConfig, index: number) {
        new GpioValveAccessory(this.log, irrg, valveConfig, index + 1, this.api);
    }

    accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
        callback(this.accessoryPlugins);
    }

}
