import {AccessoryPlugin, Logging} from "homebridge";
import {Characteristic, CharacteristicValue, CharacteristicSetCallback, Service} from "hap-nodejs";
import {CronJob} from "cron";

import {GpioIrrigationSystemAccessory} from "./irrigationsystem";
import {GpioOutput} from "../gpio/gpio_output";
import {Timer} from "../utils/timer";
import {Automation, Outlet} from "../config_types";

export class GpioValveAccessory implements AccessoryPlugin {

    private readonly name;
    private readonly service;

    private timer: Timer | null = null;
    private manualDuration: number = 300;
    private gpio: GpioOutput;

    private jobs: CronJob[] = [];

    constructor(public readonly log: Logging, public readonly parent: GpioIrrigationSystemAccessory, public readonly outlet: Outlet, public readonly index: number) {
        this.name = this.parent.name + ".Zone " + index;
        this.service = new Service.Valve(this.parent.name, "" + index);
        this.gpio = new GpioOutput(this.log, this.outlet.pin, this.outlet.invertHighLow);

        this.initService();
        this.bindService();

        this.scheduleJobs();
        this.activateJobs();
    }

    initService(): void {
        this.service.setCharacteristic(Characteristic.Active, Characteristic.Active.INACTIVE);
        this.service.setCharacteristic(Characteristic.InUse, Characteristic.InUse.NOT_IN_USE);
        this.service.setCharacteristic(Characteristic.ValveType, Characteristic.ValveType.IRRIGATION);

        this.service.setCharacteristic(Characteristic.SetDuration, this.manualDuration);
        this.service.setCharacteristic(Characteristic.RemainingDuration, 0);
        this.service.setCharacteristic(Characteristic.IsConfigured, Characteristic.IsConfigured.CONFIGURED);
        this.service.setCharacteristic(Characteristic.ServiceLabelIndex, this.index);
    }

    bindService(): void {
        this.service.getCharacteristic(Characteristic.Active).on("set", this.onSetActive.bind(this));

        this.service.getCharacteristic(Characteristic.SetDuration).onSet(this.onSetSetDuration.bind(this));
        this.service.getCharacteristic(Characteristic.RemainingDuration).onGet(this.onGetRemainingDuration.bind(this));
        this.service.getCharacteristic(Characteristic.IsConfigured).onSet(this.onSetIsConfigured.bind(this));
    }

    onSetActive(value: CharacteristicValue, callback: CharacteristicSetCallback): void {
        callback();
        if (value === Characteristic.Active.ACTIVE) this.startTimer(this.manualDuration);
        if (value === Characteristic.Active.INACTIVE) this.interruptTimer();
        this.parent.onChangeActive();
    }

    onSetSetDuration(value: CharacteristicValue): void {
        if (typeof value === "number") this.manualDuration = value;
    }

    onGetRemainingDuration(): CharacteristicValue {
        return Math.max(this.timer?.getRemainingTime() || 0, 0);
    }

    onSetIsConfigured(value: CharacteristicValue): void {
        if (value === Characteristic.IsConfigured.CONFIGURED) this.activateJobs();
        if (value === Characteristic.IsConfigured.NOT_CONFIGURED) this.stopJobs();
    }

    startTimer(duration: number): void {
        this.interruptTimer();
        this.timer = new Timer(duration, this.inUse.bind(this), this.notInUse.bind(this));
        this.service.updateCharacteristic(Characteristic.RemainingDuration, duration);
        this.parent.onChangeRemainingDuration();
    }

    interruptTimer(): void {
        this.timer?.interruptTimer();
    }

    inUse(): void {
        this.service.updateCharacteristic(Characteristic.InUse, Characteristic.InUse.IN_USE);
        this.gpio.on();
        this.parent.onChangeInUse();
    }

    notInUse(): void {
        this.gpio.off();
        this.service.updateCharacteristic(Characteristic.InUse, Characteristic.InUse.NOT_IN_USE);
        this.parent.onChangeInUse();
    }

    getValveService() {
        return this.service;
    }

    getServices(): Service[] {
        return [this.service];
    }

    logInfo(message: string) {
        this.log.info("[%s] %s", this.name, message);
    }

    scheduleJobs(): void {
        this.outlet.automation.forEach(this.scheduleAutomation.bind(this));
    }

    scheduleAutomation(a: Automation): void {
        if (a.active) {
            const dayOfWeek = a.dayOfWeek || "*";
            this.jobs.push(new CronJob(a.minute + " " + a.hour + " * * " + dayOfWeek, this.startTimer.bind(this, a.duration)));
            this.logInfo("schedule job at " + a.hour + ":" + a.minute + " at days " + dayOfWeek);
        }
    }

    activateJobs() {
        this.logInfo("enable scheduled jobs");
        this.jobs.forEach(j => j.start());
    }

    stopJobs() {
        this.logInfo("disable scheduled jobs");
        this.jobs.forEach(j => j.stop());
    }

}
