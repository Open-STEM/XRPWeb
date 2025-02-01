import AppMgr, { EventType } from '@/managers/appmgr';
import { ConnectionCMD } from '@/utils/types';
import { XRPDataMgr } from './xrpdatamgr';
import { CommandToXRPMgr } from './commandstoxrpmgr';


/**
 * ConnectionMgr - manages USB and Bluetooth connection to the XRP Robot
 */
export default class ConnectionMgr {
    private appMgr: AppMgr = AppMgr.getInstance();
    private xrpDataMgr: XRPDataMgr = XRPDataMgr.getInstance();
    private commandsToXRPMgr: CommandToXRPMgr = CommandToXRPMgr.getInstance();

    private PORT: SerialPort | undefined;      // Reference to serial port
    private READER: ReadableStreamDefaultReader<Uint8Array>  | undefined;    // Reference to serial port reader, only one can be locked at a time
    private WRITER: WritableStreamDefaultWriter<Uint8Array> | undefined;    // Reference to serial port writer, only one can be locked at a time
    
    private USB_VENDOR_ID_BETA: number = 11914;     // For filtering ports during auto or manual selection
    private USB_VENDOR_ID: number = 6991;     // For filtering ports during auto or manual selection
    private USB_PRODUCT_ID_BETA: number = 5;        // For filtering ports during auto or manual selection
    private USB_PRODUCT_ID: number = 70;        // For filtering ports during auto or manual selection 

    //bluetooth information
    private BLE_DEVICE: BluetoothDevice | undefined;
    private btService: BluetoothRemoteGATTService | undefined;
    private READBLE: BluetoothRemoteGATTCharacteristic | undefined;
    private WRITEBLE: BluetoothRemoteGATTCharacteristic | undefined;
   
    // UUIDs for standard NORDIC UART service and characteristics
    private UART_SERVICE_UUID: string = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
    private TX_CHARACTERISTIC_UUID: string = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
    private RX_CHARACTERISTIC_UUID: string = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
    private BLE_DISCONNECT_TIME: number = 0;

    // Set true so most terminal output gets passed to javascript terminal
    private DEBUG_CONSOLE_ON: boolean = true;

    // Used to stop interaction with the XRP
    private BUSY: boolean = false;
    private RUN_BUSY: boolean = false; //used to distinguish that we are in the RUN of a user program vs other BUSY.

    private DISCONNECT: boolean = true;

    private LAST_RUN: string | undefined; //keep track of the last program that was run, don't need to save main if it is the same.

    //private RUN_ERROR: string | undefined; //The text of any returned error

    //They pressed the STOP button while a program was executing
    private STOP: boolean = false;

    // ### CALLBACKS ###
    // Functions defined outside this module but used inside
    onConnect: (() => void) | undefined;
    IDSet: (() => void) | undefined;
    onDisconnect: (() => void) | undefined;
    onFSData: ((data: string, meta: string[]) => void) | undefined;
    doPrintSeparator: (() => void) | undefined;
    forceTermNewline: (() => void) | undefined;
    startJoyPackets: (() => void) | undefined;
    stopJoyPackets: (() => void) | undefined;

    //this.onShowUpdate = undefined;
    showMicropythonUpdate: (() => Promise<void>) | undefined;

    

    buffer: number[] = []; //buffer of read values to catch escape sequences.

    // Use to disable auto connect if manual connecting in progress
    MANUALLY_CONNECTING: boolean = false;

    
    constructor() {
        //constructor
          //setup serial connect listener√
          //setup serial disconnect listener√

        // Connect USB√
        // USB AutoConnect√
        // Connect Bluetooth
        //BLE disconnect
        //BLE reconnect

        //checkIfNeedUpdate
        //updateMicropython
        //updateLibrary

        //STOP
        //stopTheRobot
        //Disconnect


        /*** Listen for Subscriptions ***/

        this.appMgr.on(EventType.EVENT_CONNECTION, (subType: string) => {
            console.log("Connection manager event, sub type: " + subType);
            switch(subType){
                case ConnectionCMD.CONNECT_USB:
                    this.connectCable();
                    break;
                case ConnectionCMD.CONNECT_BLUETOOTH:
                    this.BLE_DISCONNECT_TIME = Date.now();
                    this.connectBLE();
                    break;
            }
        });

        /*** Setup USB Connect and Disconnect listeners ***/
        // Check if browser can use WebSerial
        if ("serial" in navigator) {
            if (this.DEBUG_CONSOLE_ON) console.log("Serial supported in this browser!");
            // Attempt auto-connect when page validated device plugged in, do not start manual selection menu
            navigator.serial.addEventListener('connect', () => {
                if (this.MANUALLY_CONNECTING == false) {
                    this.tryAutoConnect();
                    //TODO: if successful pub message that we connected
                }
            });


            // Probably set flags/states when page validated device removed
            navigator.serial.addEventListener('disconnect', (e) => {
                var disconnectedPort = e.target as SerialPort;

                // Only display disconnect message if there is a matching port on auto detect or not already disconnected
                if (this.checkPortMatching(disconnectedPort) && this.DISCONNECT == false) {
                    if (this.DEBUG_CONSOLE_ON) console.log("User unplugged XRP USB connection");
                    this.WRITER = undefined;
                    this.READER = undefined;
                    this.PORT = undefined;
                    this.DISCONNECT = true; // Will stop certain events and break any EOT waiting functions
                    this.BUSY = false;      // If not set false here, if disconnected at just the right time, can't connect until refresh
                    //TODO Pub message that we disconnected
                }
            });
        } else {
            console.log("Serial NOT supported in your browser! Use Microsoft Edge or Google Chrome");
        }

    }

    /*** Publish items to Pub / Sup ***/

    

    /*** USB Connection Routines ***/

    async connectCable() {
        if (this.BUSY == true) {
            return;
        }

        var autoConnected = await this.tryAutoConnect();

        const filters = [
            { usbVendorId: this.USB_VENDOR_ID_BETA, usbProductId: this.USB_PRODUCT_ID_BETA },
            { usbVendorId: this.USB_VENDOR_ID, usbProductId: this.USB_PRODUCT_ID }
          ];


        if (!autoConnected) {
            if (this.DEBUG_CONSOLE_ON) console.log("fcg: trying manual USB Cable connect");

            this.BUSY = true;
            this.MANUALLY_CONNECTING = true;

            await navigator.serial.requestPort({filters}).then(async (port) => {
                this.PORT = port;
                if (this.DEBUG_CONSOLE_ON) console.log("%cManually connected!");
                if (await this.openPort()) {
                    this.finishConnect();
                }
                else {
                    console.log("Connection FAILED. Check cable and try again");
                    //TODO: How report failure
                }
            }).catch((err) => {
                if (this.DEBUG_CONSOLE_ON) console.log("Not manually connected to USB Cable...", err);
                //document.getElementById('IDConnectBTN')!.style.display = "block";
                //TODO: Report error
            });
            this.MANUALLY_CONNECTING = false;
            this.BUSY = false;
            if (this.DEBUG_CONSOLE_ON) console.log("fcg: out of connectCable");
        }

    }

    async tryAutoConnect(): Promise<boolean> {
        if (this.BUSY == true) {
            return false;
        }
        this.BUSY = true;
        if (this.DEBUG_CONSOLE_ON) console.log("fcg: in tryAutoConnect");

        //window.ATERM.writeln("Connecting to XRP..."); //let the user know that we are trying to connect.

        if (this.DEBUG_CONSOLE_ON) console.log("%cTrying auto connect...");
        var ports = await navigator.serial.getPorts();
         if(Array.isArray(ports)){
             for(var ip=0; ip<ports.length; ip++){
                 if(this.checkPortMatching(ports[ip])) {
                     this.PORT = ports[ip];
                     if(this.DEBUG_CONSOLE_ON) console.log("%cAuto connected!", "color: lime");
                     if (await this.openPort()){
                         this.finishConnect();
                         this.BUSY = false;
                         if (this.DEBUG_CONSOLE_ON) console.log("fcg: out of tryAutoConnect");
                         return true;
                     }
                 }
             }
         } else {
            if(this.checkPortMatching(ports)) {
                this.PORT = ports; 
                if(this.DEBUG_CONSOLE_ON) console.log("%cAuto connected!", "color: lime");
                if(await this.openPort()){
                    this.finishConnect();
                    this.BUSY = false;
                    if (this.DEBUG_CONSOLE_ON) console.log("fcg: out of tryAutoConnect");
                }
                return true;
            }
         }

        if (this.DEBUG_CONSOLE_ON)
            console.log("%cNot Auto connected...");
        //document.getElementById('IDConnectBTN')!.style.display = "block";
        //TODO: report error
        this.BUSY = false;

        if (this.DEBUG_CONSOLE_ON)
            console.log("fcg: out of tryAutoConnect");
        return false;
    }


    async openPort(): Promise<boolean> {
        if (this.PORT != undefined) {
            this.DISCONNECT = false;
            try {
                await this.PORT.open({ baudRate: 115200 });
                return true;
                
            } catch (err: any) {
                if (err.name == "InvalidStateError") {
                    if (this.DEBUG_CONSOLE_ON) console.log("%cPort already open, everything good to go!", "color: lime");
                    return true;
                } else if (err.name == "NetworkError") {
                    //alert("Opening port failed, is another application accessing this device/port?");
                    if (this.DEBUG_CONSOLE_ON) console.log("%cOpening port failed, is another application accessing this device/port?", "color: red");
                    return false;
                }
            }
        } else {
            console.error("Port undefined!");
            return false;
        }
         return false;
    }

    // Returns true if product and vendor ID match for MicroPython, otherwise false #
    checkPortMatching(port: SerialPort): boolean {
        var info = port.getInfo();
        if((info.usbProductId == this.USB_PRODUCT_ID  && info.usbVendorId == this.USB_VENDOR_ID) || (info.usbProductId == this.USB_PRODUCT_ID_BETA  && info.usbVendorId == this.USB_VENDOR_ID_BETA)){
            return true;
        }
        return false;
    }

    /*** Bluetooth BLE connection routines ***/

    async connectBLE() {

        if (this.DEBUG_CONSOLE_ON) console.log("fcg: in connectBLE ");

        this.BUSY = true;
        //this.MANNUALLY_CONNECTING = true;
        if (this.DEBUG_CONSOLE_ON) console.log("Trying manual connectBLE..");

        this.BLE_DEVICE = undefined; //just in case we were connected before.

        var elapseTime = (Date.now() - this.BLE_DISCONNECT_TIME) / 1000;
        if (elapseTime > 60) {
            console.log(elapseTime);
            //await window.alertMessage("Error while detecting bluetooth devices. \nPlease refresh the browser and try again.");
            //TODO: Warn of need to refresh
            return;
        }

        // Function to connect to the device
        await navigator.bluetooth.requestDevice({
            filters: [{
                namePrefix: 'XRP'
            }], optionalServices: [this.UART_SERVICE_UUID]
        })
            .then(device => {
                //console.log('Connecting to device...');
                this.BLE_DEVICE = device;
                return device.gatt!.connect();
            })
            .then(servers => {
                //console.log('Getting UART Service...');
                return servers.getPrimaryService(this.UART_SERVICE_UUID);
            })
            .then(btService => {
                this.btService = btService;
                //console.log('Getting TX Characteristic...');
                return btService.getCharacteristic(this.TX_CHARACTERISTIC_UUID);
            })
            .then(characteristic => {
                //console.log('Connected to TX Characteristic');
                this.WRITEBLE = characteristic;
                //console.log('Getting RX Characteristic...');
                return this.btService!.getCharacteristic(this.RX_CHARACTERISTIC_UUID);
                // Now you can use the characteristic to send data
            }).then(characteristic => {
                this.READBLE = characteristic;
                //this.READBLE.addEventListener('characteristicvaluechanged', this.readloopBLE);
                this.READBLE!.startNotifications();
                this.BLE_DEVICE!.addEventListener('gattserverdisconnected', () => {this.bleDisconnect()});
                this.finishConnect();
            })
            .catch(error => {
                console.log('Error: ' + error);
            });

        //this.MANNUALLY_CONNECTING = false;
        this.BUSY = false;
        if (this.DEBUG_CONSOLE_ON) console.log("fcg: out of ConnectBLE");

    }

    /* The bluetooth connection has been lost, it could because of many reasons. 
        * they hit the STOP button and we did a soft reboot
        * a brown out
        * The XRP moved out of range
    
        We will wait for 10sec to see if it re-connects, if not then we will declare a disconnect.
     */
    bleDisconnect() {

        if (this.DEBUG_CONSOLE_ON) console.log("BLE Disconnected");
        this.BLE_DISCONNECT_TIME = Date.now();
        this.WRITEBLE = undefined;
        this.READBLE = undefined;
        this.DISCONNECT = true; // Will stop certain events and break any EOT waiting functions
        if (!this.STOP) { //If they pushed the STOP button then don't make it look disconnected it will be right back
            //this.onDisconnect?.();
            console.log("bleDisconnect - they didn't press STOP")
        }
        //this.SPECIAL_FORCE_OUTPUT_FLAG = false;
        this.RUN_BUSY = false;
        this.STOP = false;
        this.BUSY = false;
        this.bleReconnect();
    }

    async bleReconnect() {
        if (this.DISCONNECT) {
            try {
                if (this.DEBUG_CONSOLE_ON) console.log("Trying ble auto reconnect...");
                const server = await this.connectWithTimeout(this.BLE_DEVICE!, 10000); //wait for 10seconds to see if it reconnects
                //const server = await this.BLE_DEVICE.gatt.connect();
                this.btService = await server.getPrimaryService(this.UART_SERVICE_UUID);
                //console.log('Getting TX Characteristic...');
                this.WRITEBLE = await this.btService.getCharacteristic(this.TX_CHARACTERISTIC_UUID);
                this.READBLE = await this.btService.getCharacteristic(this.RX_CHARACTERISTIC_UUID);
                this.READBLE.startNotifications();
                this.finishConnect();
                if (this.DEBUG_CONSOLE_ON) console.log("fcg: out of tryAutoConnect");
                return true;
                // Perform operations after successful connection
            } catch (error) {
                console.log('timed out: ', error);
                this.BLE_DEVICE = undefined;
                //this.onDisconnect?.();
                //document.getElementById('IDConnectBTN')!.disabled = false;
            }
        }
    }

    connectWithTimeout(device: BluetoothDevice, timeoutMs: number): Promise<BluetoothRemoteGATTServer> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error("Connection timed out"));
            }, timeoutMs);

            device.gatt!.connect()
                .then(server => {
                    clearTimeout(timeoutId);
                    resolve(server);
                })
                .catch(err => {
                    clearTimeout(timeoutId);
                    reject(err);
                });
        });
    }


    /*** Common routines  ***/

    async finishConnect() {
        this.DISCONNECT = false;
        console.log(this.READER);
        console.log(this.WRITER);
        console.log(this.LAST_RUN);
        console.log(this.RUN_BUSY);
        console.log(this.WRITEBLE);
        this.xrpDataMgr.startReadLoop(this.PORT, this.READBLE, this.WRITEBLE);
        console.log(await this.commandsToXRPMgr.batteryVoltage());
        console.log(await this.commandsToXRPMgr.getVersionInfo());
        
        /* TODO: implement
        if (await this.checkIfMP()) {
            if (this.HAS_MICROPYTHON == false) {    //something went wrong, just get out of here
                return;
            }
            this.BUSY = false;
            await this.getToNormal();
            await this.getOnBoardFSTree();
            this.onConnect?.();
        }
        */

        this.LAST_RUN = undefined;
        this.BUSY = false;

        /* TODO: implement
        if (this.PORT != undefined) { //if we connected via USB then we can release the BLE terminal
            await this.resetTerminal();
        }
        await this.resetIsRunning();
        await this.checkIfNeedUpdate();
        this.IDSet?.();
        */
    }

    
}
