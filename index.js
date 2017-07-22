"use strict";

const async = require('async'),
      SensorTag = require('sensortag');

const IOT_HUB_NAME = 'mtczeroiot28f26.azure-devices.net';
const DEVICE_KEY = 'bzayvlUI7YL811nI3N8oQOHzch6ZyPNp/j0UXGo51+Q=';

let DEVICES = [
    {
        'id': 'b09122ea3903',
        'name': 'MTCSensorTag01'
    }
];

const ENABLE_IR_TEMPERATURE = true;
const ENABLE_ACCELEROMETER = true;
const ENABLE_HUMIDITY = true;
const ENABLE_MAGNETOMETER = false;
const ENABLE_BAROMETRIC_PRESSURE = false;
const ENABLE_GYROSCOPE = false;
const ENABLE_LUXOMETER = false;

function discover() {
    SensorTag.discoverById('b09122ea3903', (sensorTag) => {

        sensorTag.on('disconnect', () => {
            setTimeout(() => {
                discover();
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
                    console.log('objTemp: %d F', toFahrenheit(objTemp).toFixed(1));
                    console.log('ambTemp: %d F', toFahrenheit(ambTemp).toFixed(1));
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

discover();
