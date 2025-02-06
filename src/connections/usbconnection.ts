import Connection, { ConnectionState } from '@connections/connection';

/**
 * USB Connection - establish USB serial connection to the XRP Robot
 */
export class USBConnection extends Connection {
    // Define USB connection variables
    private port: SerialPort | undefined = undefined;
    private reader: ReadableStreamDefaultReader<Uint8Array> | undefined = undefined; // Reference to serial port reader, only one can be locked at a time
    private writer: WritableStreamDefaultWriter<Uint8Array> | undefined = undefined; // Reference to serial port writer, only one can be locked at a time

    // Define USB connection constants
    readonly USB_VENDOR_ID_BETA: number = 11914; // For filtering ports during auto or manual selection
    readonly USB_VENDOR_ID: number = 6991; // For filtering ports during auto or manual selection
    readonly USB_PRODUCT_ID_BETA: number = 5; // For filtering ports during auto or manual selection
    readonly USB_PRODUCT_ID: number = 70; // For filtering ports during auto or manual selection

    constructor() {
        super();

        // setup USB connection listeners
        // Check if browser can use WebSerial
        if ('serial' in navigator) {
            this.connLogger.debug('This browser supports serial port');
            // Attempt auto-connect when page validated device plugged in, do not start manual selection menu
            navigator.serial.addEventListener('connect', () => {
                if (this.isManualConnection == false) {
                    this.tryAutoConnect();
                    //TODO: if successful pub message that we connected
                }
            });

            // Probably set flags/states when page validated device removed
            navigator.serial.addEventListener('disconnect', (e) => {
                const disconnectedPort = e.target as SerialPort;

                // Only display disconnect message if there is a matching port on auto detect or not already disconnected
                if (this.checkPortMatching(disconnectedPort) && this.connectionStates !== ConnectionState.Disconnect) {
                    this.connLogger.debug('User unplugged XRP USB connection cable');
                    this.writer = undefined;
                    this.reader = undefined;
                    this.port = undefined;
                    this.connectionStates = ConnectionState.Disconnect;
                    //TODO Pub message that we disconnected
                }
            });
        } else {
            this.connLogger.debug('Serial NOT supported in your browser! Use Microsoft Edge or Google Chrome');
            //TODO: send a pub/sub to UI to display this information in a modal dialog
        }
    }

    /**
     * readWorker - this worker read data from the XRP robot
     */
    private async readWorker() {

        while (this.connectionStates === ConnectionState.Connected) {
            this.connLogger.debug('USB readWorker..');
            //this.PORT != undefined && this.PORT.readable &&
            // Check if reader locked (can be locked if try to connect again and port was already open but reader wasn't released)
            if (this.port && this.port.readable) {
                if (!this.port.readable.locked) {
                    this.reader = this.port.readable.getReader();
                }
            }

            try {
                while (true) {
                    // https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader/read
                    if (this.reader != undefined) {
                        const { value, done } = await this.reader.read();
                        if (done) {
                            // Allow the serial port to be closed later.
                            this.reader.releaseLock();
                            break;
                        }
                        this.readData(value);
                    } 
                }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                // TODO: Handle non-fatal read error.
                if (err.name == 'NetworkError') {
                    this.connLogger.debug('Device most likely unplugged, handled');
                    //this.disconnect();
                    //I think doing numbing is fine as it will see the disconnect in the connectionMgr
                }
            }
            this.connLogger.debug('Current read loop ended!');
        }
    }

    /**
     * checkPortMatching - Returns true if product and vendor ID match for MicroPython, otherwise false #
     * @param port
     * @returns
     */
    private checkPortMatching(port: SerialPort): boolean {
        const info = port.getInfo();
        if (
            (info.usbProductId == this.USB_PRODUCT_ID && info.usbVendorId == this.USB_VENDOR_ID) ||
            (info.usbProductId == this.USB_PRODUCT_ID_BETA &&
                info.usbVendorId == this.USB_VENDOR_ID_BETA)
        ) {
            return true;
        }
        return false;
    }

    private async tryAutoConnect(): Promise<boolean> {
        this.connLogger.debug('Entering tryAutoConnection');
        if (this.connectionStates === ConnectionState.Busy) {
            return false;
        }
        this.connectionStates = ConnectionState.Connected;

        //window.ATERM.writeln("Connecting to XRP..."); //let the user know that we are trying to connect.
        const ports = await navigator.serial.getPorts();
         if(Array.isArray(ports)){
             for(let ip=0; ip<ports.length; ip++){
                 if(this.checkPortMatching(ports[ip])) {
                     this.port = ports[ip];
                     if (await this.openPort()){
                         this.onConnected();
                         this.connectionStates = ConnectionState.Connected
                         return true;
                     }
                 }
             }
         } else {
            if(this.checkPortMatching(ports)) {
                this.port = ports; 
                if(await this.openPort()){
                    this.onConnected();
                    this.connectionStates = ConnectionState.Connected;
                }
                return true;
            }
         }

        //document.getElementById('IDConnectBTN')!.style.display = "block";
        //TODO: report error
        this.connectionStates = ConnectionState.Connected;

        this.connLogger.debug('Existing tryAutoConnect');
        return false;
    }

    private async openPort(): Promise<boolean> {
        if (this.port != undefined) {
            this.connectionStates =ConnectionState.Disconnect;
            try {
                await this.port.open({ baudRate: 115200 });
                return true;
                
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                if (err.name == "InvalidStateError") {
                    this.connLogger.debug('Port already open, everything is good to go!');
                    return true;
                } else if (err.name == "NetworkError") {
                    //alert("Opening port failed, is another application accessing this device/port?");
                    this.connLogger.debug('Port openning failed, is there another application accessing this device and port?');
                    return false;
                }
            }
        } else {
            console.error("Port undefined!");
            return false;
        }
         return false;
    }

    /**
     * onConnected
     */
    private onConnected() {
        this.connectionStates = ConnectionState.Connected;
        //TODO:  start the read looad
        if (this.port) this.writer = this.port.writable?.getWriter();
        this.readWorker();
        if (this.callback) {
            this.callback();
        }
        this.lastProgramRan = undefined;
    }

    /**
     * isConnection - query connection status
     */
    public isConnected(): boolean {
        return (this.connectionStates === ConnectionState.Connected);
    }

    /**
     * connection - creates an async connection and return result via promise
     */
    public async connect(callback: () => void): Promise<void> {
        this.callback = callback;
        if (this.connectionStates == ConnectionState.Busy) {
            return;
        }

        const autoConnected = await this.tryAutoConnect();

        const filters = [
            { usbVendorId: this.USB_VENDOR_ID_BETA, usbProductId: this.USB_PRODUCT_ID_BETA },
            { usbVendorId: this.USB_VENDOR_ID, usbProductId: this.USB_PRODUCT_ID }
          ];


        if (!autoConnected) {
            this.connLogger.debug('Trying to perform a manual USB cable connection');
            this.connectionStates = ConnectionState.Busy;
            this.isManualConnection = true;

            await navigator.serial.requestPort({filters}).then(async (port) => {
                this.port = port;
                this.connLogger.debug('Manually connected!');
                if (await this.openPort()) {
                    this.onConnected();
                }
                else {
                    this.connLogger.debug("Connection FAILED. Check cable and try again");
                    //TODO: How report failure
                }
            }).catch((err) => {
                throw new Error('can not manually connect using USB cable: ' + err.message);
                //document.getElementById('IDConnectBTN')!.style.display = "block";
                //TODO: Report error
            });
            this.isManualConnection = false;
            this.connectionStates = ConnectionState.Connected;
        }

        this.connLogger.debug('Existing connect');
    }

    /**
     * disconnection - disconnect the USB connection
     */
    public async disconnect(): Promise<void> {
        if (this.port) {
            await this.port.close();
            this.port = undefined;
            this.connLogger.debug('USB connection closed.');
        }
    }

    /**
     * writeToDevice - write data to device
     * @param str 
     */
    public async writeToDevice(str: string | Uint8Array) {
        this.connLogger.debug('Writing to device' + str);
        if (this.writer != undefined) {
            if (typeof str == 'string') {
                await this.writer.write(this.textEncoder.encode(str));
            } else {
                await this.writer.write(str);
            }
        }
    }
}
