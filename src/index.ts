import {API} from 'homebridge';

import {PLATFORM_NAME} from './settings';
import {GpioIrrigationSystemPlatform} from './platform';

/**
 * This method registers the accessory with Homebridge
 */
export = (api: API) => {
    api.registerPlatform(PLATFORM_NAME, GpioIrrigationSystemPlatform);
};
