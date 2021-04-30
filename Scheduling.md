# Scheduling

A time control for the valves is also included. It is possible to define times at which watering takes place for a
certain time. The library [cron](https://www.npmjs.com/package/cron) is used. You can specify hour, minute and dayOfWeek
as time pattern to start a zone / valve for a specified duration.

For example if you want to start a zone / valve each weekday at 6:00 and 20:00 for 300 seconds and at weekend each half hour for 20 seconds config will be:

```json
{
  "automation": [{
    "duration": 300,
    "hour": "6,20",
    "minute": "00",
    "dayOfWeek": "2-5"
  }, {
    "duration": 20,
    "hour": "0-23",
    "minute": "00,30",
    "dayOfWeek": "1,6"
  }]
}
```
