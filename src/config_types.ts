import {PlatformConfig} from "homebridge";

export type Config = PlatformConfig | {
    systems: System[];
}

export type System = {
    name: string;
    outlets: Outlet[];
}

export type Outlet = {
    pin: number;
    invertHighLow: boolean;
    automation: Automation[];
}

export type Automation = {
    active: boolean;
    duration: number;
    hour: string;
    minute: string;
    dayOfWeek: string | null;
}
