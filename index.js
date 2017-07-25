#!/usr/bin/env node

"use strict";

const _ = require('lodash'),
      async = require('async'),
      clientFromConnectionString = require('azure-iot-device-amqp').clientFromConnectionString,
      Message = require('azure-iot-device').Message;

// the 'IoT Hub Name' (e.g. the name of the IoT Hub that was created)
const IOT_HUB_NAME = 'mtczeroiot28f26';

// Array of SensorTag devices to monitor
//
// id: the id of the SensorTag (use the mobile app to get the id easier, but it's the MAC address without t$// name: the 'IoT Device Name' that you entered into IoT Hub
// key: the 'IoT Connection Key' (e.g. the primary key for the device)
let DEVICES = [
    {
        'id': 'b09122ea3903',
        'name': 'MTCSensorTag01',
        'key': 'bzayvlUI7YL811nI3N8oQOHzch6ZyPNp/j0UXGo51+Q='
    },
    {
        'id': '247189cc5405',
        'name': 'MTCSensorTag02',
        'key': 'IX93C1o7vneTN4qoqOmg7VQWndr+SNfQyD99zT3ekno='
    },
    {
        'id': 'cc78ab7f5786',
        'name': 'MTCSensorTag03',
        'key': 'C5svvLe8bR1/HMCdNz6TK/vq7yxdmFZvJ3iXH8UrAiI='
    }
];

// enable which features should be reported to IoT Hub
// IMPORTANT: When you change which features are reported, 
//            you MUST wait 15 mins before IoT Hub begins reporting
const ENABLE_IR_TEMPERATURE = false;
const ENABLE_ACCELEROMETER = false;
const ENABLE_HUMIDITY = false; //t
const ENABLE_MAGNETOMETER = false;
const ENABLE_BAROMETRIC_PRESSURE = false; //t
const ENABLE_GYROSCOPE = false;
const ENABLE_LUXOMETER = true; //t

// milliseconds between transmissions (default 5 seconds)
const TX_TIMEOUT = 5000;

class Discovery {
    constructor() {
        this.sensorTag = require('sensortag');
    }

    discover() {
        console.log('searching...');
        this.sensorTag.discover((tag) => {
            this.device = _.filter(DEVICES, { id: tag.id })[0];
            this.tag = tag;
            this.onDiscover();
        });
    }

    onDiscover() {
        console.log('found device: ' + this.device.id);

        this.tag.on('disconnect', () => {
            clearInterval(this.interval);
            this.setProp('sendEnabled', false);
            console.log('disconnecting (' + this.device.name + ')...');
            setTimeout(this.discover(), 1000);
        });

        async.series([
            (cb) => {
                console.log('connecting (' + this.device.name + ')...');
                this.tag.connectAndSetUp(cb);
            },
            (cb) => { this.config_ir(cb); },
            (cb) => { this.config_accelerometer(cb); },
            (cb) => { this.config_humidity(cb); },
            (cb) => { this.config_magnetometer(cb); },
            (cb) => { this.config_barometric(cb); },
            (cb) => { this.config_gyroscope(cb); },
            (cb) => { this.config_luxometer(cb); },
            (cb) => {
                this.setProp('sendEnabled', true);
                this.transmit();
                cb();
            }
        ]);
    }

    config_ir(cb) {
        if (ENABLE_IR_TEMPERATURE) {
            console.log('enabling IR temperature...');
            this.tag.enableIrTemperature(() => {

                this.tag.notifyIrTemperature(() => {
                    this.tag.on('irTemperatureChange', (objTemp, ambTemp) => {
                        console.log('infraTemp: %d F', toFahrenheit(objTemp).toFixed(1));
                        console.log('ambTemp: %d F', toFahrenheit(ambTemp).toFixed(1));
                        this.setProp('Infrared Temperature', toFahrenheit(objTemp));
                        this.setProp('Ambient Temperature', toFahrenheit(ambTemp));
                    });
                });
            });

            cb();
        } else {
            this.tag.disableIrTemperature(cb);
        }
    }

    config_accelerometer(cb) {
        if (ENABLE_ACCELEROMETER) {
            console.log('enabling accelerometer...');
            this.tag.enableAccelerometer(() => {

                this.tag.notifyAccelerometer(() => {
                    this.tag.on('accelerometerChange', (x, y, z) => {
                        console.log('x: %d G', x.toFixed(1));
                        console.log('y: %d G', y.toFixed(1));
                        console.log('z: %d G', z.toFixed(1));
                        this.setProp('Accelerometer X', x);
                        this.setProp('Accelerometer Y', y);
                        this.setProp('Accelerometer Z', z);
                    });
                });
            });

            cb();
        } else {
            this.tag.disableAccelerometer(cb);
        }
    }

    config_humidity(cb) {
        if (ENABLE_HUMIDITY) {
            console.log('enabling humidity...');
            this.tag.enableHumidity(() => {

                this.tag.notifyHumidity(() => {
                    this.tag.on('humidityChange', (temp, humidity) => {
                        console.log('temp: %d F', toFahrenheit(temp).toFixed(1));
                        console.log('humidity: %d F', toFahrenheit(humidity).toFixed(1));
                        this.setProp('Temperature', toFahrenheit(temp));
                        this.setProp('Humidity', toFahrenheit(humidity));
                    });
                });
            });

            cb();
        } else {
            this.tag.disableHumidity(cb);
        }
    }

    config_magnetometer(cb) {
        if (ENABLE_MAGNETOMETER) {
            console.log('enabling magnetometer...');
            this.tag.enableMagnetometer(() => {

                this.tag.notifyMagnetometer(() => {
                    this.tag.on('magnetometerChange', (x, y, z) => {
                        console.log('x: %d μT', x.toFixed(1));
                        console.log('y: %d μT', y.toFixed(1));
                        console.log('z: %d μT', z.toFixed(1));
                        this.setProp('Magnetometer X', x);
                        this.setProp('Magnetometer Y', y);
                        this.setProp('Magnetometer Z', z);
                    });
                });
            });

            cb();
        } else {
            this.tag.disableMagnetometer(cb);
        }
    }

    config_barometric(cb) {
        if (ENABLE_BAROMETRIC_PRESSURE) {
            console.log('enabling barometric pressure...');
            this.tag.enableBarometricPressure(() => {

                this.tag.notifyBarometricPressure(() => {
                    this.tag.on('barometricPressureChange', (pressure) => {
                        console.log('pressure: %d mBar', pressure.toFixed(1));
                        this.setProp('Barometric Pressure', pressure);
                    });
                });
            });

            cb();
        } else {
            this.tag.disableBarometricPressure(cb);
        }
    }

    config_gyroscope(cb) {
        if (ENABLE_GYROSCOPE) {
            console.log('enabling gyroscope...');
            this.tag.enableGyroscope(() => {

                this.tag.notifyGyroscope(() => {
                    this.tag.on('gyroscopeChange', (x, y, z) => {
                        console.log('x: %d /s', x.toFixed(1));
                        console.log('y: %d /s', y.toFixed(1));
                        console.log('z: %d /s', z.toFixed(1));
                        this.setProp('Rotation X', x);
                        this.setProp('Rotation Y', y);
                        this.setProp('Rotation Z', z);
                    });
                });
            });

            cb();
        } else {
            this.tag.disableGyroscope(cb);
        }
    }

    config_luxometer(cb) {
        if (ENABLE_LUXOMETER && this.tag.type === 'cc2650') {
            console.log('enabling luxometer...');
            this.tag.enableLuxometer(() => {

                this.tag.notifyLuxometer(() => {
                    this.tag.on('luxometerChange', (lux) => {
                        console.log('lux: %d', lux.toFixed(1));
                        this.setProp('Luxometer', lux);
                    });
                });
            });

            cb();
        } else {
            this.tag.disableLuxometer(cb);
        }
    }

    toFahrenheit(cel) {
        return (cel * 1.8) + 32;
    }

    setProp(key, value) {
        this.device[key] = value;
    }

    formatPayload(id) {
        return _.omit(this.device,  ['id', 'name', 'key', 'sendEnabled']);
    }

    transmit() {
        let connectionString = 'HostName=' + IOT_HUB_NAME + '.azure-devices.net;DeviceId=' + this.device.name + ';SharedAccessKey=' + this.device.key;
        let client = clientFromConnectionString(connectionString);

        this.interval = setInterval(() => {
            let payload = this.formatPayload(this.device.id);

            if (Object.keys(payload).length > 0 && this.device.sendEnabled) {
                payload.DeviceId = this.device.name;
                let message = new Message(JSON.stringify(payload));

                console.log('Sending (' + this.device.name + ') payload...');
                client.sendEvent(message, () => {
                    return (err, res) => {
                        if (err) console.error('error (' + this.device.name + '): ' + err.toString());
                    }
                });
            }
        }, TX_TIMEOUT);
    }
}

function go() {
    let discovery = new Discovery();
    discovery.discover();
}

go();



