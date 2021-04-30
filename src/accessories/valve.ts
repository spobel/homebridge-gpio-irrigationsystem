import {AccessoryPlugin, Logging, CharacteristicValue, CharacteristicSetCallback, API} from "homebridge";
import {CronJob} from "cron";

import {GpioIrrigationSystemAccessory} from "./irrigationsystem";
import {GpioOutput} from "../gpio/gpio_output";
import {Timer} from "../utils/timer";
import {AutomationConfig, ValveConfig} from "../config_types";

let Characteristic, Service;

export class GpioValveAccessory implements AccessoryPlugin {

    private readonly name;
    private readonly valveService;

    private timer: Timer | null = null;
    private manualDuration: number = 300;
    private gpio: GpioOutput;

    private jobs: CronJob[] = [];
    private jobsAreActive = true;

    constructor(public readonly log: Logging, public readonly parent: GpioIrrigationSystemAccessory, public readonly outlet: ValveConfig, public readonly index: number, private api: API) {
        Characteristic = api.hap.Characteristic;
        Service = api.hap.Service;

        this.name = this.parent.name + ".Zone " + index;
        this.logInfo("Initializing...");

        this.valveService = new Service.Valve(this.parent.name, "" + index);
        this.gpio = new GpioOutput(this.logInfo.bind(this), this.outlet.pin, this.outlet.invertHighLow);

        this.initService();
        this.bindService();

        this.scheduleJobs();
        this.activateJobs();
    }

    getServices(): typeof Service[] {
        return [this.valveService];
    }

    initService(): void {
        this.valveService.setCharacteristic(Characteristic.Active, Characteristic.Active.INACTIVE);
        this.valveService.setCharacteristic(Characteristic.InUse, Characteristic.InUse.NOT_IN_USE);
        this.valveService.setCharacteristic(Characteristic.ValveType, Characteristic.ValveType.IRRIGATION);

        this.valveService.setCharacteristic(Characteristic.SetDuration, this.manualDuration);
        this.valveService.setCharacteristic(Characteristic.RemainingDuration, 0);
        this.valveService.setCharacteristic(Characteristic.IsConfigured, Characteristic.IsConfigured.CONFIGURED);
        this.valveService.setCharacteristic(Characteristic.ServiceLabelIndex, this.index);
    }

    bindService(): void {
        this.valveService.getCharacteristic(Characteristic.Active).on("set", this.onSetActive.bind(this));
        this.valveService.getCharacteristic(Characteristic.InUse).onSet(this.onSetInUse.bind(this));

        this.valveService.getCharacteristic(Characteristic.SetDuration).onSet(this.onSetSetDuration.bind(this));
        this.valveService.getCharacteristic(Characteristic.RemainingDuration).onGet(this.onGetRemainingDuration.bind(this));
        this.valveService.getCharacteristic(Characteristic.IsConfigured).onSet(this.onSetIsConfigured.bind(this));
    }

    onSetActive(value: CharacteristicValue, callback: CharacteristicSetCallback): void {
        callback();
        if (value === Characteristic.Active.ACTIVE) this.startTimer(this.manualDuration);
        if (value === Characteristic.Active.INACTIVE) this.interruptTimer();
        this.parent.onChangeActive();
    }

    onSetInUse(value: CharacteristicValue): void {
        this.log.info("set to %s", value);
        this.parent.onChangeInUse();
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
        this.parent.onChangeActive();
    }

    setInUse() {
        this.valveService.updateCharacteristic(Characteristic.InUse, Characteristic.InUse.IN_USE);
    }

    setNotInUse() {
        this.valveService.updateCharacteristic(Characteristic.InUse, Characteristic.InUse.NOT_IN_USE);
    }

    startTimer(duration: number): void {
        this.interruptTimer();
        this.timer = new Timer(duration, this.open.bind(this), this.close.bind(this));
        this.valveService.updateCharacteristic(Characteristic.RemainingDuration, duration);
        this.parent.onChangeRemainingDuration();
    }

    interruptTimer(): void {
        this.timer?.interruptTimer();
    }

    open(): void {
        this.gpio.on(this.setInUse.bind(this));
    }

    close(): void {
        this.gpio.off(this.setNotInUse.bind(this));
    }

    getValveService() {
        return this.valveService;
    }

    logInfo(message: string) {
        this.log.info("[%s] %s", this.name, message);
    }

    scheduleJobs(): void {
        this.outlet.automation.forEach(this.scheduleAutomation.bind(this));
    }

    scheduleAutomation(a: AutomationConfig): void {
        if (a.active) {
            const cron = a.minute + " " + a.hour + " * * " + a.dayOfWeek;
            this.jobs.push(new CronJob(cron, this.startTimer.bind(this, a.duration)));
            this.logInfo("schedule job at cron '" + cron + "'");
        }
    }

    hasActiveJobs() {
        if (this.jobs.length === 0) return false;
        return this.jobsAreActive;
    }

    activateJobs() {
        this.logInfo("enable scheduled jobs");
        this.jobsAreActive = true;
        this.jobs.forEach(j => j.start());
    }

    stopJobs() {
        this.logInfo("disable scheduled jobs");
        this.jobsAreActive = false;
        this.jobs.forEach(j => j.stop());
    }

}
