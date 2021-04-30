import {AccessoryPlugin, Logging} from 'homebridge';
import {Characteristic, CharacteristicValue, Service} from "hap-nodejs";
import {ValveConfig, SystemConfig} from "../config_types";
import {GpioValveAccessory} from "./valve";

export class GpioIrrigationSystemAccessory implements AccessoryPlugin {

    public readonly name;
    private readonly accessoryInformationService;
    private readonly irrigationSystemService;
    private readonly subValves: GpioValveAccessory[] = [];

    constructor(private readonly log: Logging, private readonly system: SystemConfig) {
        this.name = system.name;
        this.logInfo("Initializing...");
        this.accessoryInformationService = new Service.AccessoryInformation();
        this.irrigationSystemService = new Service.IrrigationSystem(this.name);
        this.initAccessoryInformation();
        this.initIrrigationSystem();
        this.initValves();
    }

    generateSerial() {
        return this.system.valves
            .map((v, index) => (index + 1) + ":" + v.pin)
            .reduce((a, b) => a + "-" + b);
    }

    initAccessoryInformation() {
        this.getAccessoryInformationService().setCharacteristic(Characteristic.Manufacturer, "spobel");
        this.getAccessoryInformationService().setCharacteristic(Characteristic.SerialNumber, this.generateSerial());
        this.getAccessoryInformationService().setCharacteristic(Characteristic.Model, "Gpio Irrigation System");
    }

    initIrrigationSystem(): void {
        this.getIrrigationSystemService().setCharacteristic(Characteristic.Active, Characteristic.Active.ACTIVE);
        this.getIrrigationSystemService().setCharacteristic(Characteristic.ProgramMode, Characteristic.ProgramMode.PROGRAM_SCHEDULED);
        this.getIrrigationSystemService().setCharacteristic(Characteristic.InUse, Characteristic.InUse.NOT_IN_USE);
        this.getIrrigationSystemService().setCharacteristic(Characteristic.RemainingDuration, 0);
    }

    initValves() {
        this.system.valves.forEach(this.initValve.bind(this));
        this.subValves.forEach(v => this.getIrrigationSystemService().addLinkedService(v.getValveService()));
    }

    initValve(valveConfig: ValveConfig, index: number) {
        this.subValves.push(new GpioValveAccessory(this.log, this, valveConfig, index + 1));
    }

    onChangeActive(): void {
        this.getIrrigationSystemService().updateCharacteristic(Characteristic.ProgramMode, this.getProgramModeCharacteristicValue());
    }

    getProgramModeCharacteristicValue(): 0 | 1 | 2 {
        if (this.isLinkedValveActive()) return Characteristic.ProgramMode.PROGRAM_SCHEDULED_MANUAL_MODE_
        if (this.isLinkedValveScheduled()) return Characteristic.ProgramMode.PROGRAM_SCHEDULED;
        return Characteristic.ProgramMode.NO_PROGRAM_SCHEDULED;
    }

    isLinkedValveActive(): boolean {
        return this.countCharacteristicSetToInLinkedServices(Characteristic.Active, Characteristic.Active.ACTIVE) >= 1;
    }

    isLinkedValveScheduled(): boolean {
        return this.subValves.filter(v => v.hasActiveJobs()).length > 0;
    }

    onChangeInUse(): void {
        this.getIrrigationSystemService().updateCharacteristic(Characteristic.InUse, this.getInUseCharacteristicValue());
    }

    getInUseCharacteristicValue(): 0 | 1 {
        return this.isLinkedValveInUse() ? Characteristic.InUse.IN_USE : Characteristic.InUse.NOT_IN_USE;
    }

    isLinkedValveInUse(): boolean {
        return this.countCharacteristicSetToInLinkedServices(Characteristic.InUse, Characteristic.InUse.IN_USE) >= 1;
    }

    onChangeRemainingDuration(): void {
        const remaining = this.sumLinkedValveRemainingDuration();
        this.getIrrigationSystemService().updateCharacteristic(Characteristic.RemainingDuration, remaining < 0 ? 0 : remaining);
    }

    sumLinkedValveRemainingDuration(): number {
        return this.getIrrigationSystemService().linkedServices
            .map(v => v.getCharacteristic(Characteristic.RemainingDuration).value || 0)
            .map(a => parseInt(a.toString()))
            .reduce((a, b) => a + b);
    }

    countCharacteristicSetToInLinkedServices(characteristic, value: CharacteristicValue): number {
        return this.subValves
            .map(v => v.getValveService())
            .filter(l => l.getCharacteristic(characteristic).value === value).length;
    }

    getAccessoryInformationService(): Service {
        return this.accessoryInformationService;
    }

    getIrrigationSystemService(): Service {
        return this.irrigationSystemService;
    }

    logInfo(message: string) {
        this.log.info("[%s] %s", this.name, message);
    }

    getServices(): Service[] {
        return [this.accessoryInformationService,
            this.irrigationSystemService,
            ...(this.subValves.map(v => v.getValveService()))];
    }

}
