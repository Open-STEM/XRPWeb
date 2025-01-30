/**
 * ConnectionMgr - manages USB and Bluetooth connection to the XRP Robot
 */
export class ConnectionMgr {
    PORT: SerialPort | undefined;      // Reference to serial port
    READER: ReadableStreamDefaultReader<Uint8Array>  | undefined;    // Reference to serial port reader, only one can be locked at a time
    WRITER: WritableStreamDefaultWriter<Uint8Array> | undefined;    // Reference to serial port writer, only one can be locked at a time

    TEXT_ENCODER: TextEncoder = new TextEncoder();  // Used to write text to MicroPython
    TEXT_DECODER: TextDecoder = new TextDecoder();  // Used to read text from MicroPython

    USB_VENDOR_ID: number = 11914;     // For filtering ports during auto or manual selection
    USB_PRODUCT_ID: number = 5;        // For filtering ports during auto or manual selection
    USB_PRODUCT_MAC_ID: number = 10;   // For filtering ports during auto or manual selection

    //bluetooth information
    BLE_DEVICE: BluetoothDevice | undefined;
    btService: BluetoothRemoteGATTService | undefined;
    READBLE: BluetoothRemoteGATTCharacteristic | undefined;
    WRITEBLE: BluetoothRemoteGATTCharacteristic | undefined;
    LASTBLEREAD: any; // TODO: unsure of type
    BLE_DATA: Uint8Array | null = null;
    BLE_DATA_RESOLVE: ((value: Uint8Array) => void) | null = null;
    BLE_STOP_MSG: string = "##XRPSTOP##"


    // UUIDs for standard NORDIC UART service and characteristics
    UART_SERVICE_UUID: string = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
    TX_CHARACTERISTIC_UUID: string = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
    RX_CHARACTERISTIC_UUID: string = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

    XRP_SEND_BLOCK_SIZE: number = 250;  // wired can handle 255 bytes, but BLE 5.0 is only 250

    // Set true so most terminal output gets passed to javascript terminal
    DEBUG_CONSOLE_ON: boolean = true;

    COLLECT_RAW_DATA: boolean = false;
    COLLECTED_RAW_DATA: number[] = [];

    HAS_MICROPYTHON: boolean = false;

    // Used to stop interaction with the XRP
    BUSY: boolean = false;
    RUN_BUSY: boolean = false; //used to distinguish that we are in the RUN of a user program vs other BUSY.

    DISCONNECT: boolean = true;

    LAST_RUN: string | undefined; //keep track of the last program that was run, don't need to save main if it is the same.

    RUN_ERROR: string | undefined; //The text of any returned error

    //They pressed the STOP button while a program was executing
    STOP: boolean = false;

    // ### CALLBACKS ###
    // Functions defined outside this module but used inside
    onData: ((data: string) => void) | undefined;
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

    // ### MicroPython Control Commands ###
    // DOCS: https://docs.micropython.org/en/latest/esp8266/tutorial/repl.html#other-control-commands
    // UNICODE CTRL CHARS COMBOS: https://unicodelookup.com/#ctrl
    CTRL_CMD_RAWMODE: string = "\x01";     // ctrl-A (used for waiting to get file information, upload files, run custom python tool, etc)
    CTRL_CMD_NORMALMODE: string = "\x02";  // ctrl-B (user friendly terminal)
    CTRL_CMD_KINTERRUPT: string = "\x03";  // ctrl-C (stops a running program)
    CTRL_CMD_SOFTRESET: string = "\x04";   // ctrl-D (soft reset the board, required after a command is entered in raw!)
    CTRL_CMD_PASTEMODE: string = "\x05";

    SPECIAL_FORCE_OUTPUT_FLAG: boolean = false;
    CATCH_OK: boolean = false;

    buffer: number[] = []; //buffer of read values to catch escape sequences.

    // Use to disable auto connect if manual connecting in progress
    MANUALLY_CONNECTING: boolean = false;

    
    public ConnectionMgr() {
        //constructor
          //setup serial connect listener
          //setup serial disconnect listener

        // Connect USB
        // USB AutoConnect
        // Connect Bluetooth
        //BLE disconnect
        //BLE reconnect

        //checkIfNeedUpdate
        //updateMicropython
        //updateLibrary

        //STOP
        //stopTheRobot
        //Disconnect


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

    /*** USB Connection Routines ***/

    async connectCable() {
        if (this.BUSY == true) {
            return;
        }

        var autoConnected = await this.tryAutoConnect();

        const usbVendorId = this.USB_VENDOR_ID;
        const usbProductId = this.USB_PRODUCT_ID;
        //const usbProductMacId = this.USB_PRODUCT_MAC_ID;

        if (!autoConnected) {
            if (this.DEBUG_CONSOLE_ON) console.log("fcg: trying manual USB Cable connect");

            this.BUSY = true;
            this.MANUALLY_CONNECTING = true;

            await navigator.serial.requestPort({ filters: [{ usbVendorId, usbProductId }] }).then(async (port) => {
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
                this.WRITER = this.PORT.writable?.getWriter();     // Make a writer since this is the first time port opened
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


    async finishConnect() {
        this.DISCONNECT = false;
        //this.readLoop();
        //TODO: Start the readloop 

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

    // Returns true if product and vendor ID match for MicroPython, otherwise false #
    checkPortMatching(port: SerialPort): boolean {
        var info = port.getInfo();
        if ((info.usbProductId == this.USB_PRODUCT_ID || info.usbProductId == this.USB_PRODUCT_MAC_ID) && info.usbVendorId == this.USB_VENDOR_ID) {
            return true;
        }
        return false;
    }
}
