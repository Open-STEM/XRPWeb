/**
 * XRPDataMgr - Manages data being sent or received from the XRP
 */
export class XRPDataMgr {

    private static instance: XRPDataMgr;


    private PORT: SerialPort | undefined;      // Reference to serial port
    private READER: ReadableStreamDefaultReader<Uint8Array>  | undefined;    // Reference to serial port reader, only one can be locked at a time
    private WRITER: WritableStreamDefaultWriter<Uint8Array> | undefined;    // Reference to serial port writer, only one can be locked at a time

    TEXT_ENCODER: TextEncoder = new TextEncoder();  // Used to write text to MicroPython
    TEXT_DECODER: TextDecoder = new TextDecoder();  // Used to read text from MicroPython


    //bluetooth information
    private READBLE: BluetoothRemoteGATTCharacteristic | undefined;
    private WRITEBLE: BluetoothRemoteGATTCharacteristic | undefined;
    //private LASTBLEREAD: any; // TODO: unsure of type
    private BLE_DATA: Uint8Array | null = null;
    private BLE_DATA_RESOLVE: ((value: Uint8Array) => void) | null = null;
    //private BLE_STOP_MSG: string = "##XRPSTOP##"

    private XRP_SEND_BLOCK_SIZE: number = 250;  // wired can handle 255 bytes, but BLE 5.0 is only 250

    private DISCONNECT: boolean = false;

    // Set true so most terminal output gets passed to javascript terminal
    private DEBUG_CONSOLE_ON: boolean = true;

    private buffer: Uint8Array = new Uint8Array(0);

    private RUN_BUSY: boolean = false; //used to distinguish that we are in the RUN of a user program vs other BUSY.

    private SPECIAL_FORCE_OUTPUT_FLAG: boolean = false;
    private CATCH_OK: boolean = false;


    // Use to disable auto connect if manual connecting in progress
    MANUALLY_CONNECTING: boolean = false;

    private READ_UNTIL_STRING: string = "";    // Set to something not "" to halt until this.READ_UNTIL_STRING found and collect lines in this.COLLECTED_DATA
    private COLLECTED_DATA: string = "";
    

     // ### MicroPython Control Commands ###
    // DOCS: https://docs.micropython.org/en/latest/esp8266/tutorial/this.html#other-control-commands
    // UNICODE CTRL CHARS COMBOS: https://unicodelookup.com/#ctrl
    private CTRL_CMD_RAWMODE: string = "\x01";     // ctrl-A (used for waiting to get file information, upload files, run custom python tool, etc)
    private CTRL_CMD_NORMALMODE: string = "\x02";  // ctrl-B (user friendly terminal)
    private CTRL_CMD_KINTERRUPT: string = "\x03";  // ctrl-C (stops a running program)
    private CTRL_CMD_SOFTRESET: string = "\x04";   // ctrl-D (soft reset the board, required after a command is entered in raw!)

    private COLLECT_RAW_DATA: boolean = false;
    private COLLECTED_RAW_DATA: number[] = [];

    constructor() {
        //constructor
        
        //readloop - should be a worker
        //WriteToDevice

        //SendTerminalKbd

    }

    public static getInstance(): XRPDataMgr {
        if (!XRPDataMgr.instance) {
            XRPDataMgr.instance = new XRPDataMgr();
        }
        return this.instance;
    }

    public async startReadLoop(port: SerialPort | undefined, readBLE: BluetoothRemoteGATTCharacteristic | undefined, writeBLE: BluetoothRemoteGATTCharacteristic | undefined ){
        this.PORT = port;
        this.READBLE = readBLE;
        this.WRITEBLE = writeBLE;
        if (this.PORT && this.PORT.writable) {
            this.WRITER = this.PORT.writable.getWriter();     // Make a writer since this is the first time port opened
        }
        console.log(this.WRITEBLE, this.WRITER); //satisfy this for now.
        this.readLoop();
    }

    public async readLoop() {
        // Every time the readloop is started means a device was connect/reconnected, reset variables states in case of reconnect

        while (this.DISCONNECT == false) {   //this.PORT != undefined && this.PORT.readable &&
            // Check if reader locked (can be locked if try to connect again and port was already open but reader wasn't released)
            if (this.PORT && this.PORT.readable) {
                if (! this.PORT.readable.locked) {
                    this.READER = this.PORT.readable.getReader();
                }
            } else {
                this.startBLEData();
            }

            try {
                while (true) {
                    var values: Uint8Array | undefined = undefined;
                    // https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader/read
                    if (this.READER != undefined) {
                        const { value, done } = await this.READER.read();
                        values = value;
                        if (done) {
                            // Allow the serial port to be closed later.
                            this.READER.releaseLock();
                            break;
                        }
                    } else {
                        values = await this.getBLEData();
                    }
                    if (values) {
                        // Reading from serial is done in chunks of a inconsistent/non-guaranteed size,
                        if (this.DEBUG_CONSOLE_ON) console.log(this.TEXT_DECODER.decode(values));

                        //We need to handle the case where esc sequences are broken up into multiple reads.
                        // look for esc sequences that mean something to us:
                        // Data to be graphed
                        // Switch input modes:
                        //     controller (keyboard or joystick)
                        //     standard keyboard input
                        var tempValue = values;
                        tempValue = this.HandleEsc(tempValue);
                        if (tempValue.length > 0) {
                            const index = tempValue.lastIndexOf(27);
                            if (index != -1 && this.RUN_BUSY == true) {  //ignore these escapes if not in run mode.
                                if (tempValue[index + 1] == 101) {
                                    //start getting Joystick packets on the input stream
                                    //this.startJoyPackets?.();
                                    values = tempValue = new Uint8Array(0);
                                }
                                if (tempValue[index + 1] == 102) {
                                    //Stop Joystick packets on the input stream
                                    //this.stopJoyPackets?.();
                                    values = tempValue = new Uint8Array(0);
                                }
                            }
                        }

                        // Collect lines when read until active, otherwise, output to terminal
                        if (this.READ_UNTIL_STRING == "") {
                            if (tempValue.length > 0) {

                                this.onData(this.TEXT_DECODER.decode(new Uint8Array(tempValue)));
                            }
                        } else {
                            // There are two things going on here.
                            //     1 - When we are running a program, we want all incoming lines to be pushed to the terminal
                            //     2 - Except the very first 'OK'. There are timing issues and this was the best place to catch it.
                            //            This makes the user output look a lot nicer without the 'OK' showing up.
                            if (this.SPECIAL_FORCE_OUTPUT_FLAG) {
                                if (this.CATCH_OK) {
                                    let v = this.TEXT_DECODER.decode(values)
                                    if (v.startsWith("OK")) {
                                        this.CATCH_OK = false;
                                        this.onData(v.slice(2));
                                    } else {
                                        this.onData(this.TEXT_DECODER.decode(values));
                                    }
                                } else {
                                    this.onData(this.TEXT_DECODER.decode(values));
                                }
                            }

                            this.COLLECTED_DATA += this.TEXT_DECODER.decode(values);

                            // If raw flag set true, collect raw data for now
                            if (this.COLLECT_RAW_DATA == true) {
                                for (var i = 0; i < values.length; i++) {
                                    this.COLLECTED_RAW_DATA.push(values[i]);
                                }
                            }
                        }
                    }
                }
            } catch (err: any) {
                // TODO: Handle non-fatal read error.
                if (err.name == "NetworkError") {
                    if (this.DEBUG_CONSOLE_ON) console.log("%cDevice most likely unplugged, handled");
                    //this.disconnect();
                    //I think doing numbing is fine as it will see the disconnect in the connectionMgr
                }
            }
        }
        if (this.DEBUG_CONSOLE_ON) console.log("%cCurrent read loop ended!");
        //this.BUSY = false;
    }

    onData(data : string) {
        console.log(data);
        //TODO: this is data headed to the terminal
    }

    // BLE functions
    
    startBLEData() {
        // Set up the event listener for the RX characteristic
        this.READBLE!.addEventListener('characteristicvaluechanged', event => {
            const charEvent = event as Event & { target: BluetoothRemoteGATTCharacteristic };
            const value = charEvent.target.value;
            //if(this.DEBUG_CONSOLE_ON) console.log(this.TEXT_DECODER.decode(value));
            if (this.BLE_DATA == undefined) {
                this.BLE_DATA = new Uint8Array(value!.buffer); //just in case the resolve is not ready
            } else {
                this.BLE_DATA = this.concatUint8Arrays(this.BLE_DATA, new Uint8Array(value!.buffer));
            }
            if (this.BLE_DATA_RESOLVE) {
                this.BLE_DATA_RESOLVE(this.BLE_DATA);
                this.BLE_DATA_RESOLVE = null;
                this.BLE_DATA = new Uint8Array(0);
            }
            //let str = arrayBufferToString(value.buffer); // Convert ArrayBuffer to string
            //resolve(new Uint8Array(value.buffer)); // Resolve the promise with the received string
        });
        // Optional: Reject the promise on some condition, e.g., timeout or error
    }

    async getBLEData(timeout = 1000) : Promise<Uint8Array | undefined> {
        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                this.BLE_DATA_RESOLVE = null; // Clear reference
                resolve(undefined);
            }, timeout);
    
            this.BLE_DATA_RESOLVE = (data) => {
                clearTimeout(timeoutId); // Prevent timeout from resolving
                resolve(data);
            };
        });
    }

    HandleEsc(value: Uint8Array): Uint8Array {
        this.buffer = this.concatUint8Arrays(this.buffer, value);
        var temp: Uint8Array = new Uint8Array(0);
        var x = this.buffer.lastIndexOf(27); //is there an escape in this string
        if (x == -1) {
            temp = this.buffer;
            this.buffer = new Uint8Array(0);
            return temp;
        }
        else {
            var escEnded = false;
            x++;
            for (x; x < this.buffer.length; x++) {
                var char = this.buffer[x];
                if (char >= 65 && char <= 90 || char >= 97 && char <= 122) {
                    escEnded = true;
                    break;
                }
            }
            if (escEnded) {
                temp = this.buffer;
                this.buffer = new Uint8Array(0);
            }
            else {
                temp = new Uint8Array(0);
            }
            return temp;
        }
    }

    concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {
        const result = new Uint8Array(a.length + b.length);
        result.set(a, 0);
        result.set(b, a.length);
        return result;
    }

    
    str2ab(str: string): ArrayBuffer {
        var buf = new ArrayBuffer(str.length);
        var bufView = new Uint8Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++)
            bufView[i] = str.charCodeAt(i);
        return buf;
    }

    public async writeToDevice(str: string | Uint8Array) {
        if (this.WRITER != undefined) {
            if (typeof str == "string") {
                await this.WRITER.write(this.TEXT_ENCODER.encode(str));
            }
            else {
                await this.WRITER.write(str);
            }
        } else if (this.WRITEBLE != undefined) {
            try {
                if (typeof str == "string") {
                    //console.log("writing: " + str);
                    await this.WRITEBLE.writeValue(this.str2ab(str));
                } else {
                    //console.log("writing: " + this.TEXT_DECODER.decode(str));
                    await this.WRITEBLE.writeValue(str);
                }
            } catch (error) {
                console.log(error);
            }
        } else {
            if (this.DEBUG_CONSOLE_ON) console.log("%cNot writing to device, none connected", "color: red");
        }
    }

    startCollectRawData() {
        this.COLLECT_RAW_DATA = true;
        this.COLLECTED_RAW_DATA = [];
    }

    endCollectRawData() {
        this.COLLECT_RAW_DATA = false;
    }


    startReaduntil(str: string) {
        this.READ_UNTIL_STRING = str;
        this.COLLECTED_DATA = "";
    }


    // Wait until an OK is received, else write ctrl-c since raw sometimes gets stuck? Seems to work for upload files
    async waitUntilOK() {
        var times = 0;

        while (this.DISCONNECT == false) {
            var tempLines = this.COLLECTED_DATA.split('\r\n');

            for (var i = 0; i < tempLines.length; i++) {
                if (tempLines[i] == "OK" || tempLines[i] == ">") {
                    return;
                }
            }

            times = times + 1;
            if (times >= 20) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 5));
        }
    }


    // Will stall js until finds line set by startReaduntil().
    // Providing an offset will skip subsequent lines after the
    // found line set by startReaduntil.
    // Loops forever if never finds line set by startReaduntil()
    async haltUntilRead(omitOffset: number = 0, waitTime: number = -1): Promise<string[]> {
        var waitOmitOffset = 0;
        var numTimes = waitTime;

        // Re-evaluate collected data for readUntil line every 85ms
        while (this.DISCONNECT == false && numTimes != 0) {
            var tempLines = this.COLLECTED_DATA.split('\r\n');

            for (var i = 0; i < tempLines.length; i++) {
                if (tempLines[i] == this.READ_UNTIL_STRING || this.READ_UNTIL_STRING == "" || tempLines[i].indexOf(this.READ_UNTIL_STRING) != -1
                    || tempLines[i] == ">") { // Keyboard interrupt
                    // Wait for omitOffset lines
                    if (i > tempLines.length - omitOffset && waitOmitOffset < 5) {
                        waitOmitOffset++;
                        break;
                    }
                    this.READ_UNTIL_STRING = "";

                    // Output the rest of the lines that should not be hidden
                    // Should find a way to do this without adding newlines again

                    for (var j = i + omitOffset; j < tempLines.length; j++) {
                        if (j != tempLines.length - 1) {
                            this.onData?.(tempLines[j] + "\r\n");
                        } else {
                            this.onData?.(tempLines[j]);
                        }
                    }

                    return tempLines.slice(0, i + omitOffset);    // Return all lines collected just before the line that switched off haltUntil()
                }
            }
            await new Promise(resolve => setTimeout(resolve, 85));
            if (waitTime != -1) {
                numTimes--;
            }
        }
        return [];
    }

    async softReset() {
        return;
        //this.startReaduntil("MPY: soft reboot");
        //await this.writeToDevice(this.CTRL_CMD_SOFTRESET);
        //await this.haltUntilRead(3);
    }

    // https://github.com/micropython/micropython/blob/master/tools/pyboard.py#L325
    async getToNormal(omitOffset: number = 0) {
        await this.getToRaw();  // Get to raw first so that unwanted messages are not printed (like another intro message)

        //this.startReaduntil("Raspberry Pi Pico W with RP2040");
        this.startReaduntil("MicroPython");
        //this.startReaduntil("information.");
        // https://github.com/micropython/micropython/blob/master/tools/pyboard.py#L360 for "\r"
        await this.writeToDevice("\r" + this.CTRL_CMD_NORMALMODE);
        await this.haltUntilRead(omitOffset);
    }

    async getToRaw() {
        this.startReaduntil("raw REPL; CTRL-B to exit");
        // Refer to pyboard.py for "\r" https://github.com/micropython/micropython/blob/master/tools/pyboard.py#L326-L334
        await this.writeToDevice("\r" + this.CTRL_CMD_KINTERRUPT + this.CTRL_CMD_KINTERRUPT);  // ctrl-C twice: interrupt any running program
        await this.writeToDevice("\r" + this.CTRL_CMD_RAWMODE);
        await this.haltUntilRead(2);

        await this.softReset();
    }


    // Goes into raw mode and writes a command according to the THUMBY_SEND_BLOCK_SIZE then executes
    async writeUtilityCmdRaw(cmdStr: string, waitForCmdEnd: boolean = false, omitAmount: number = 0, customWaitForStr: string = ">"): Promise<string[] | undefined> {
        // Get into raw mode
        await this.getToRaw();

        // Send the cmd string
        var numberOfChunks = Math.ceil(cmdStr.length / this.XRP_SEND_BLOCK_SIZE) + 1;
        for (var b = 0; b < numberOfChunks; b++) {
            var writeDataCMD = cmdStr.slice(b * this.XRP_SEND_BLOCK_SIZE, (b + 1) * this.XRP_SEND_BLOCK_SIZE);
            if (this.DEBUG_CONSOLE_ON) console.log(writeDataCMD);
            await this.writeToDevice(writeDataCMD);
        }

        if (waitForCmdEnd) {
            this.startReaduntil(customWaitForStr);
            await this.writeToDevice(this.CTRL_CMD_SOFTRESET);
            if (customWaitForStr == ">") await this.waitUntilOK();
            return await this.haltUntilRead(omitAmount, 300); //added timeout since micropython 1.19 sometimes will not get the soft reset and hang
        } else {
            await this.writeToDevice(this.CTRL_CMD_SOFTRESET);
        }
        return;
    }


}