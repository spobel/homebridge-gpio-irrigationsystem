import {AccessoryPlugin, Logging} from 'homebridge';
import {Characteristic, CharacteristicValue, Service} from "hap-nodejs";
import {Outlet, System} from "../config_types";
import {GpioValveAccessory} from "./valve";

export class GpioIrrigationSystemAccessory implements AccessoryPlugin {

    public readonly name;
    private readonly services: Service[] = [];

    constructor(private readonly log: Logging, private readonly system: System) {
        this.name = system.name;
        this.initAccessoryInformation();
        this.initIrrigationSystem();
        this.initValves();
    }

    initAccessoryInformation() {
        const accessoryInformation = new Service.AccessoryInformation();
        accessoryInformation.setCharacteristic(Characteristic.Manufacturer, "spobel");
        accessoryInformation.setCharacteristic(Characteristic.SerialNumber, "123");
        accessoryInformation.setCharacteristic(Characteristic.Model, "Gpio Irrigation System");
        this.services.push(accessoryInformation);
    }

    initIrrigationSystem(): void {
        const irrigationSystem = new Service.IrrigationSystem(this.name)
        irrigationSystem.setCharacteristic(Characteristic.Active, Characteristic.Active.ACTIVE);
        irrigationSystem.setCharacteristic(Characteristic.ProgramMode, Characteristic.ProgramMode.PROGRAM_SCHEDULED);
        irrigationSystem.setCharacteristic(Characteristic.InUse, Characteristic.InUse.NOT_IN_USE);
        irrigationSystem.setCharacteristic(Characteristic.RemainingDuration, 0);
        this.services.push(irrigationSystem);
    }

    initValves() {
        this.system.outlets.forEach(this.initValve.bind(this));
    }

    initValve(outlet: Outlet, index: number) {
        const valve = new GpioValveAccessory(this.log, this, outlet, index + 1);
        this.addValveService(valve.getValveService());
    }

    onChangeActive(): void {
        this.getIrrigationSystemService().updateCharacteristic(Characteristic.ProgramMode, this.getProgramModeCharacteristicValue());
    }

    getProgramModeCharacteristicValue(): 0 | 1 | 2 {
        return this.isLinkedValveActive() ? Characteristic.ProgramMode.PROGRAM_SCHEDULED_MANUAL_MODE_ : Characteristic.ProgramMode.PROGRAM_SCHEDULED;
    }

    isLinkedValveActive(): boolean {
        return this.countCharacteristicSetToInLinkedServices(Characteristic.Active, Characteristic.Active.ACTIVE) >= 1;
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
        return this.getIrrigationSystemService().linkedServices.filter(l => l.getCharacteristic(characteristic).value === value).length;
    }

    addValveService(service: Service) {
        this.services.push(service);
        this.getIrrigationSystemService().addLinkedService(service);
    }

    getAccessoryInformationService(): Service {
        return this.services[0];
    }

    getIrrigationSystemService(): Service {
        return this.services[1];
    }

    getServices(): Service[] {
        return this.services;
    }

}