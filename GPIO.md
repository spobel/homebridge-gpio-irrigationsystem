# GPIO

It may be necessary to change the default values of GPIO when starting the Raspberry Pi.


## Startup
To activate GPIO configuration at startup you have to add a script like the following:
(You will need this to avoid wrong default values at boot time.)
```shell
sudo nano /etc/init.d/gpio
```
Script content :
```shell
#!/bin/sh
### BEGIN INIT INFO
# Provides:          gpio
# Required-Start:    $remote_fs dbus
# Required-Stop:     $remote_fs dbus
# Should-Start:      $syslog
# Should-Stop:       $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Enable GPIO
# Description:       Enable GPIO
### END INIT INFO

PATH=/sbin:/bin:/usr/sbin:/usr/bin
DESC="Enable GPIO for the Module"
NAME="gpio"
SCRIPTNAME=/etc/init.d/$NAME

. /lib/lsb/init-functions

case "$1" in
    start)
        log_daemon_msg "Enabling GPIO"
        success=0

    #Relais 1 Switch example at GPIO26
    if [ ! -e /sys/class/gpio/gpio26 ] ; then
        echo 26 > /sys/class/gpio/export
        success=$?
        echo out > /sys/class/gpio/gpio26/direction
        echo 1 > /sys/class/gpio/gpio26/value
    fi
    
    #Relais 2 Switch example at GPIO19
    if [ ! -e /sys/class/gpio/gpio19 ] ; then
        echo 19 > /sys/class/gpio/export
        success=$?
        echo out > /sys/class/gpio/gpio19/direction
        echo 1 > /sys/class/gpio/gpio19/value
    fi
    
    log_end_msg $success
    ;;
    *)
    echo "Usage: $SCRIPTNAME {start}" >&2
    exit 1
    ;;
esac

exit 0
```

Add script to startup:

```shell
sudo chmod +x /etc/init.d/gpio
sudo chown root:root /etc/init.d/gpio

sudo update-rc.d gpio defaults
sudo update-rc.d gpio enable
```
