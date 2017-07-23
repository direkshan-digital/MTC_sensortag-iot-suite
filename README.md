# SensorTag IoT Suite
This is a node.js project that enables a Raspberry Pi to transmit Texas Instruments SensorTag data to the Azure IoT Suite.  This app requires the "Remote monitoring" solution.

# Setup
For a Raspberry Pi, you'll need a couple of libraries.

## Update Repos
Update the Pi's repositories:
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

## GIT
First, obviously, you'll need GIT to download the source.
```bash
sudo apt-get install git-core -y
```

## Bluez
You will need the Bluez (Bluetooth Stack for Linux) libraries so that your Pi can communicate with bluetooth devices.

Before you install Bluez, you'll need to install some supporting libraries.
```bash
sudo apt-get install libglib2.0-0 libglib2.0-dev libdbus-1-dev libudev-dev libical-dev libreadline-dev libusb-1.0-0-dev
```

You can now install Bluez.
```bash
wget http://www.kernel.org/pub/linux/bluetooth/bluez-5.46.tar.xz
sudo tar xf bluez-5.46.tar.xz
cd bluez-5.46
sudo ./configure --prefix=/usr --mandir=/usr/share/man --sysconfdir=/etc --localstatedir=/var --with-systemdsystemunitdir --with-systemduserunitdir --enable-library
sudo make
sudo make install
```

Enable experimental features to capture Bluetooth LE.
```bash
sudo nano /lib/systemd/system/bluetooth.service
```

You should see a configuration file similar to the following:
```bash
[Unit]
Description=Bluetooth service
Documentation=man:bluetoothd(8)
ConditionPathIsDirectory=/sys/class/bluetooth
 
[Service]
Type=dbus
BusName=org.bluez
ExecStart=/usr/local/libexec/bluetooth/bluetoothd               
NotifyAccess=main
#WatchdogSec=10
#Restart=on-failure
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_BIND_SERVICE
LimitNPROC=1
 
[Install]
WantedBy=bluetooth.target
Alias=dbus-org.bluez.service
```

Enable the experimental features by adding **--experimental** to the ExecStart line, for example the configuration should look like:
```bash
[Unit]
Description=Bluetooth service
Documentation=man:bluetoothd(8)
ConditionPathIsDirectory=/sys/class/bluetooth
 
[Service]
Type=dbus
BusName=org.bluez
ExecStart=/usr/local/libexec/bluetooth/bluetoothd --experimental               
NotifyAccess=main
#WatchdogSec=10
#Restart=on-failure
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_BIND_SERVICE
LimitNPROC=1
 
[Install]
WantedBy=bluetooth.target
Alias=dbus-org.bluez.service
```

Enable bluetooth on startup.
```bash
sudo systemctl enable bluetooth
sudo systemctl daemon-reload
sudo systemctl restart bluetooth
```

You should then see something similar to the following output:
```bash
 bluetooth.service - Bluetooth service
   Loaded: loaded (/lib/systemd/system/bluetooth.service; disabled)
   Active: active (running) since Mon 2016-02-29 05:15:55 UTC; 4s ago
     Docs: man:bluetoothd(8)
 Main PID: 1022 (bluetoothd)
   Status: "Running"
   CGroup: /system.slice/bluetooth.service
           ─1022 /usr/local/libexec/bluetooth/bluetoothd --experimental
```

You can now test to ensure that the SensorTag can be recognized by the Pi. Turn on the SensorTag and type in the following:
```bash
sudo hciconfig hci0 up
sudo hcitool lescan
```

If successful, you should see something like the following:
```bash
C4:BE:78:A6:09 CC2650 Sensor Tag
```

You will notice the bluetooth address and the model number of the SensorTag.

**HINT:** The bluetooth address as lowercase and without the colons is the SensorTag's ID that you will need for the application. (e.g. 'c4be78a609')

## Node.js and NPM
You will now need to install Node.js and Node Package Manager.
```bash
wget https://nodejs.org/dist/v4.5.0/node-v4.5.0-linux-armv7l.tar.gz
sudo mv node-v4.5.0-linux-armv7l.tar.gz /opt
cd /opt
sudo tar xf node-v4.5.0-linux-arm7l.tar.gz
sudo mv node-v4.5.0-linux-arm7l nodejs
sudo rm node-v4.5.0-linux-arm7l.tar.gz
sudo rm /usr/bin/node
sudo ln -s /opt/nodejs/bin/node /usr/bin/node
sudo ln -s /opt/nodejs/bin/npm /usr/bin/npm
``` 

## Download App
Clone the application from GIT to the `/home/pi/sensortag` folder (otherwise, you'll need to update the paths located in the `sensortag.service` file).
```bash
git clone https://github.com/Microsoft/sensortag-iot-suite.git /home/pi/sensortag
```

## Configure the App
Edit the `index.js`, set the configuration constants and add the devices.  Directions for configuring the app are noted in the source code.

You can test the application to make sure it is configured successfully.

**NOTE:** The application MUST be run with elevated privileges to take advantage of certain interfaces required by supporting libaries.
```bash
sudo node index.js
```

## Set App to Run as Background Service
Now, we can set the application to run automatically when the Pi boots.
```
sudo ln -s /home/pi/sensortag/sensortag.service /etc/systemd/system/sensortag.service
sudo systemctl start sensortag
sudo systemctl enable sensortag
```

# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a 
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us 
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide a 
CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions 
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of 
Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of 
Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact 
[opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
