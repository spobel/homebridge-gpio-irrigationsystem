import {AccessoryPlugin, API, CharacteristicValue, Logging, Service} from 'homebridge';
import {SystemConfig} from "../config_types";
import {GpioValveAccessory} from "./valve";

let Characteristic;

export class GpioIrrigationSystemAccessory implements AccessoryPlugin {

    public readonly name;
    public readonly subValves: GpioValveAccessory[] = [];
    public readonly irrigationSystemService;
    public readonly labeling;
    public readonly services: Service[] = [];
    public readonly mainServices: Service[] = [];
    private readonly accessoryInformationService;

    constructor(private readonly log: Logging, private readonly system: SystemConfig, public readonly api: API) {
        Characteristic = api.hap.Characteristic;

        this.name = system.name;
        this.logInfo("Initializing...");
        this.accessoryInformationService = new api.hap.Service.AccessoryInformation();
        this.irrigationSystemService = new api.hap.Service.IrrigationSystem(this.name);
        this.irrigationSystemService.isPrimaryService = true;

        this.initAccessoryInformation();
        this.initIrrigationSystem();

        this.labeling = new api.hap.Service.ServiceLabel();
        this.labeling.setCharacteristic(Characteristic.ServiceLabelNamespace, Characteristic.ServiceLabelNamespace.ARABIC_NUMERALS);

        this.mainServices = [
            this.accessoryInformationService,
            this.labeling,
            this.irrigationSystemService];
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
        this.getIrrigationSystemService().getCharacteristic(Characteristic.Active).onSet((value) => {
            this.log.info("gettinng active %s", value);
        })

        this.getIrrigationSystemService().setCharacteristic(Characteristic.ProgramMode, Characteristic.ProgramMode.NO_PROGRAM_SCHEDULED);
        this.getIrrigationSystemService().getCharacteristic(Characteristic.ProgramMode).onGet(() => {
            this.logInfo("gettinng program mode");
            return Characteristic.ProgramMode.NO_PROGRAM_SCHEDULED;
        })

        this.getIrrigationSystemService().setCharacteristic(Characteristic.InUse, Characteristic.InUse.NOT_IN_USE);
        this.getIrrigationSystemService().getCharacteristic(Characteristic.InUse).onGet(() => {
            this.logInfo("gettinng in use");
            return Characteristic.InUse.NOT_IN_USE;
        })

        //this.getIrrigationSystemService().setCharacteristic(Characteristic.RemainingDuration, 0);
    }

    notify(): void {
        //this.getIrrigationSystemService().updateCharacteristic(Characteristic.ProgramMode, this.getProgramModeCharacteristicValue());
        //this.getIrrigationSystemService().updateCharacteristic(Characteristic.InUse, this.getInUseCharacteristicValue());

        //const remaining = this.sumLinkedValveRemainingDuration();
        //this.getIrrigationSystemService().updateCharacteristic(Characteristic.RemainingDuration, remaining < 0 ? 0 : remaining);
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

    getInUseCharacteristicValue(): 0 | 1 {
        return this.isLinkedValveInUse() ? Characteristic.InUse.IN_USE : Characteristic.InUse.NOT_IN_USE;
    }

    isLinkedValveInUse(): boolean {
        return this.countCharacteristicSetToInLinkedServices(Characteristic.InUse, Characteristic.InUse.IN_USE) >= 1;
    }

    sumLinkedValveRemainingDuration(): number {
        return this.services
            .map(v => v.getCharacteristic(Characteristic.RemainingDuration).value || 0)
            .map(a => parseInt(a.toString()))
            .reduce((a, b) => a + b);
    }

    countCharacteristicSetToInLinkedServices(characteristic, value: CharacteristicValue): number {
        return this.services
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
        return this.mainServices;
    }

}
