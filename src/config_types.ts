import {PlatformConfig} from "homebridge";

export type Config = PlatformConfig | {
    systems: SystemConfig[];
}

export type SystemConfig = {
    name: string;
    valves: ValveConfig[];
}

export type ValveConfig = {
    pin: number;
    invertHighLow: boolean;
    automation: AutomationConfig[];
}

export type AutomationConfig = {
    active: boolean;
    duration: number;
    hour: string;
    minute: string;
    dayOfWeek: string;
}
