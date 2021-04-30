# homebridge-gpio-irrigationsystem

With this plugin you can add GPIO controlled valves to Homebridge as an irrigation system.

## GPIO

The GPIO control is done by the library [onoff](https://www.npmjs.com/package/onoff). You have to configure your
raspberry pi so that [onoff](https://www.npmjs.com/package/onoff) can access the GPIOs. Instructions see [GPIO](GPIO.md)
. Depending on the outlet device, you may want to invert the GPIO signal. This can be done in the configuration of each
zone / valve.

## Settings

Look at [config.example.json](config.example.json) or use
the [Homebridge Config UI X Plugin](https://www.npmjs.com/package/homebridge-config-ui-x).

## Scheduling

A time control for the valves is also included. It is possible to define times at which watering takes place for a
certain time. The library [cron](https://www.npmjs.com/package/cron) is used. You can specify hour, minute and dayOfWeek
as time pattern to start a zone / valve for a specified duration. See [Scheduling Example](Scheduling.md) for details.
