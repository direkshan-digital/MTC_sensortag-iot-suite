"use strict";

const _ = require('lodash'),
      async = require('async'),
      SensorTag = require('sensortag'),
      clientFromConnectionString = require('azure-iot-device-amqp').clientFromConnectionString,
      Message = require('azure-iot-device').Message;

// the 'IoT Hub Name' (e.g. the name of the IoT Hub that was created)
const IOT_HUB_NAME = '<iot hub name>';

// Array of SensorTag devices to monitor
//
// id: the id of the SensorTag (use the mobile app to get the id easier, but it's the MAC address without the colons)
// name: the 'IoT Device Name' that you entered into IoT Hub
// key: the 'IoT Connection Key' (e.g. the primary key for the device)
let DEVICES = [
    {
        'id': '<device id>',
        'name': '<iot device name>',
        'key': '<iot connection key>'
    }
];

// enable which features should be reported to IoT Hub
// IMPORTANT: When you change which features are reported, 
//            you MUST wait 15 mins before IoT Hub begins reporting
const ENABLE_IR_TEMPERATURE = false;
const ENABLE_ACCELEROMETER = false;
const ENABLE_HUMIDITY = true;
const ENABLE_MAGNETOMETER = false;
const ENABLE_BAROMETRIC_PRESSURE = true;
const ENABLE_GYROSCOPE = false;
const ENABLE_LUXOMETER = true;

// milliseconds between transmissions (default 5 seconds)
const TX_TIMEOUT = 5000;

function discover(device) {
    SensorTag.discoverById(device.id, (sensorTag) => {
        setProp(sensorTag.id, 'sendEnabled', true);

        sensorTag.on('disconnect', () => {
            setProp(sensorTag.id, 'sendEnabled', false);
            setTimeout(() => {
                discover(device);
            }, 5000);
        });

        console.log('found device: ' + sensorTag.id);

        async.series([
            (cb) => {
                console.log('connecting...');
                sensorTag.connectAndSetUp(cb);
            },
            (cb) => { config_ir(sensorTag, cb); },
            (cb) => { config_accelerometer(sensorTag, cb); },
            (cb) => { config_humidity(sensorTag, cb); },
            (cb) => { config_magnetometer(sensorTag, cb); },
            (cb) => { config_barometric(sensorTag, cb); },
            (cb) => { config_gyroscope(sensorTag, cb); },
            (cb) => { config_luxometer(sensorTag, cb); }
        ]);
    });
}

function config_ir(sensorTag, cb) {
    if (ENABLE_IR_TEMPERATURE) {
        console.log('enabling IR temperature...');
        sensorTag.enableIrTemperature(() => {

            sensorTag.notifyIrTemperature(() => {
                sensorTag.on('irTemperatureChange', (objTemp, ambTemp) => {
                    console.log('infraTemp: %d F', toFahrenheit(objTemp).toFixed(1));
                    console.log('ambTemp: %d F', toFahrenheit(ambTemp).toFixed(1));
                    setProp(sensorTag.id, 'Infrared Temperature', toFahrenheit(objTemp));
                    setProp(sensorTag.id, 'Ambient Temperature', toFahrenheit(ambTemp));
                });
            });
        });

        cb();
    } else {
        sensorTag.disableIrTemperature(cb);
    }
}

function config_accelerometer(sensorTag, cb) {
    if (ENABLE_ACCELEROMETER) {
        console.log('enabling accelerometer...');
        sensorTag.enableAccelerometer(() => {

            sensorTag.notifyAccelerometer(() => {
                sensorTag.on('accelerometerChange', (x, y, z) => {
                    console.log('x: %d G', x.toFixed(1));
                    console.log('y: %d G', y.toFixed(1));
                    console.log('z: %d G', z.toFixed(1));
                    setProp(sensorTag.id, 'Accelerometer X', x);
                    setProp(sensorTag.id, 'Accelerometer Y', y);
                    setProp(sensorTag.id, 'Accelerometer Z', z);
                });
            });
        });

        cb();
    } else {
        sensorTag.disableAccelerometer(cb);
    }
}

function config_humidity(sensorTag, cb) {
    if (ENABLE_HUMIDITY) {
        console.log('enabling humidity...');
        sensorTag.enableHumidity(() => {

            sensorTag.notifyHumidity(() => {
                sensorTag.on('humidityChange', (temp, humidity) => {
                    console.log('temp: %d F', toFahrenheit(temp).toFixed(1));
                    console.log('humidity: %d F', toFahrenheit(humidity).toFixed(1));
                    setProp(sensorTag.id, 'Temperature', toFahrenheit(temp));
                    setProp(sensorTag.id, 'Humidity', toFahrenheit(humidity));
                });
            });
        });

        cb();
    } else {
        sensorTag.disableHumidity(cb);
    }
}

function config_magnetometer(sensorTag, cb) {
    if (ENABLE_MAGNETOMETER) {
        console.log('enabling magnetometer...');
        sensorTag.enableMagnetometer(() => {

            sensorTag.notifyMagnetometer(() => {
                sensorTag.on('magnetometerChange', (x, y, z) => {
                    console.log('x: %d μT', x.toFixed(1));
                    console.log('y: %d μT', y.toFixed(1));
                    console.log('z: %d μT', z.toFixed(1));
                    setProp(sensorTag.id, 'Magnetometer X', x);
                    setProp(sensorTag.id, 'Magnetometer Y', y);
                    setProp(sensorTag.id, 'Magnetometer Z', z);
                });
            });
        });

        cb();
    } else {
        sensorTag.disableMagnetometer(cb);
    }
}

function config_barometric(sensorTag, cb) {
    if (ENABLE_BAROMETRIC_PRESSURE) {
        console.log('enabling barometric pressure...');
        sensorTag.enableBarometricPressure(() => {

            sensorTag.notifyBarometricPressure(() => {
                sensorTag.on('barometricPressureChange', (pressure) => {
                    console.log('pressure: %d mBar', pressure.toFixed(1));
                    setProp(sensorTag.id, 'Barometric Pressure', pressure);
                });
            });
        });

        cb();
    } else {
        sensorTag.disableBarometricPressure(cb);
    }
}

function config_gyroscope(sensorTag, cb) {
    if (ENABLE_GYROSCOPE) {
        console.log('enabling gyroscope...');
        sensorTag.enableGyroscope(() => {

            sensorTag.notifyGyroscope(() => {
                sensorTag.on('gyroscopeChange', (x, y, z) => {
                    console.log('x: %d /s', x.toFixed(1));
                    console.log('y: %d /s', y.toFixed(1));
                    console.log('z: %d /s', z.toFixed(1));
                    setProp(sensorTag.id, 'Rotation X', x);
                    setProp(sensorTag.id, 'Rotation Y', y);
                    setProp(sensorTag.id, 'Rotation Z', z);
                });
            });
        });

        cb();
    } else {
        sensorTag.disableGyroscope(cb);
    }
}

function config_luxometer(sensorTag, cb) {
    if (ENABLE_LUXOMETER) {
        console.log('enabling luxometer...');
        sensorTag.enableLuxometer(() => {

            sensorTag.notifyLuxometer(() => {
                sensorTag.on('luxometerChange', (lux) => {
                    console.log('lux: %d', lux.toFixed(1));
                    setProp(sensorTag.id, 'Luxometer', lux);
                });
            });
        });

        cb();
    } else {
        sensorTag.disableLuxometer(cb);
    }
}

function toFahrenheit(cel) {
    return (cel * 1.8) + 32;
}

function setProp(id, key, value) {
    let obj = _.filter(DEVICES, {id: id});

    if (obj != null && obj.length == 1) {
       obj[0][key] = value;
    }
}

function formatPayload(id) {
    let obj = _.filter(DEVICES, {id: id});

    if (obj != null && obj.length == 1) {
        return _.omit(obj[0],  ['id', 'name', 'key', 'sendEnabled']);
    } else {
        return {};
    }
}

function transmit(device) {
    let connectionString = 'HostName=' + IOT_HUB_NAME + '.azure-devices.net;DeviceId=' + device.name + ';SharedAccessKey=' + device.key;
    let client = clientFromConnectionString(connectionString);

    setInterval(() => {
        let payload = formatPayload(device.id);

        if (Object.keys(payload).length > 0 && device.sendEnabled) {
            payload.DeviceId = device.name;
            let message = new Message(JSON.stringify(payload));

            console.log('Sending (' + device.name + ') payload...');
            client.sendEvent(message, () => {
                return (err, res) => {
                    if (err) console.error('error (' + device.name + '): ' + err.toString());
                }
            });
        }
    }, TX_TIMEOUT);
}

function go() {
    _.forEach(DEVICES, (device) => {
        discover(device);
        transmit(device);
    });
}

go();

