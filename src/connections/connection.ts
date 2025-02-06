import AppMgr from "@/managers/appmgr";
import logger from "@/utils/logger";

/**
 * connection states:
 *      busy
 *      connected
 */
export enum ConnectionState {
    None,
    Busy,
    Connected,
    Disconnected
}

export type ConnectionCallback = (state: ConnectionState) => void;

/**
 * Connection class - abstract class handle common connection
 */
abstract class Connection {
    protected appMgr: AppMgr = AppMgr.getInstance();
    protected isManualConnection: boolean = false;  // turn on for manual connection
    protected connectionStates: ConnectionState = ConnectionState.None; // connection busy state
    protected lastProgramRan: string | undefined;
    protected callback: ConnectionCallback | undefined;
    protected connLogger = logger.child({module: 'connections'});

    protected textEncoder: TextEncoder = new TextEncoder();
    private textDecoder: TextDecoder = new TextDecoder();
    private specialForceOutputFlag: boolean = true;
    private catchOk: boolean = false;
    private isRunBusy = false;
    private collectedData: string = '';
    private collectedRawData: number[] = [];
    private isCollectedRawData: boolean = false;
    private buffer: Uint8Array = new Uint8Array(0);

    // Set to something not "" to halt until this.READ_UNTIL_STRING found and collect lines in this.COLLECTED_DATA
    private readUntilStr = '';

    // ### MicroPython Control Commands ###
    // DOCS: https://docs.micropython.org/en/latest/esp8266/tutorial/this.html#other-control-commands
    // UNICODE CTRL CHARS COMBOS: https://unicodelookup.com/#ctrl
    private readonly CTRL_CMD_RAWMODE: string = '\x01'; // ctrl-A (used for waiting to get file information, upload files, run custom python tool, etc)
    private readonly CTRL_CMD_NORMALMODE: string = '\x02'; // ctrl-B (user friendly terminal)
    private readonly CTRL_CMD_KINTERRUPT: string = '\x03'; // ctrl-C (stops a running program)
    private readonly CTRL_CMD_SOFTRESET: string = '\x04'; // ctrl-D (soft reset the board, required after a command is entered in raw!)

    private readonly XRP_SEND_BLOCK_SIZE: number = 250; // wired can handle 255 bytes, but BLE 5.0 is only 250

    constructor() {
    }

    // abstract methods - implement by derived classes
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract isConnected(): boolean;

    /**
     * HandleEsc 
     * @param value 
     * @returns 
     */
    private HandleEsc(value: Uint8Array): Uint8Array {
        this.buffer = this.concatUint8Arrays(this.buffer, value);
        let temp: Uint8Array = new Uint8Array(0);
        let x = this.buffer.lastIndexOf(27); //is there an escape in this string
        if (x == -1) {
            temp = this.buffer;
            this.buffer = new Uint8Array(0);
            return temp;
        } else {
            let escEnded = false;
            x++;
            for (x; x < this.buffer.length; x++) {
                const char = this.buffer[x];
                if ((char >= 65 && char <= 90) || (char >= 97 && char <= 122)) {
                    escEnded = true;
                    break;
                }
            }
            if (escEnded) {
                temp = this.buffer;
                this.buffer = new Uint8Array(0);
            } else {
                temp = new Uint8Array(0);
            }
            return temp;
        }
    }

    /**
     * concatUint8Arrays - concatenate Unit8 array
     * @param a
     * @param b 
     * @returns 
     */
    protected concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {
        const result = new Uint8Array(a.length + b.length);
        result.set(a, 0);
        result.set(b, a.length);
        return result;
    }

    /**
     * readData - read data from the XRP connection
     * @param values 
     */
    protected readData(values: Uint8Array | undefined = undefined) {
        if (values) {
            // Reading from serial is done in chunks of a inconsistent/non-guaranteed size,
            this.connLogger.debug(this.textDecoder.decode(values));

            //We need to handle the case where esc sequences are broken up into multiple reads.
            // look for esc sequences that mean something to us:
            // Data to be graphed
            // Switch input modes:
            //     controller (keyboard or joystick)
            //     standard keyboard input
            let tempValue = values;
            tempValue = this.HandleEsc(tempValue);
            if (tempValue.length > 0) {
                const index = tempValue.lastIndexOf(27);
                //TODO: how to check if it is in runmode? Should it be handle this here?
                if (index != -1 && this.isRunBusy === true) {
                    //ignore these escapes if not in run mode.
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
            if (this.readUntilStr == '') {
                if (tempValue.length > 0) {
                    this.onData(this.textDecoder.decode(new Uint8Array(tempValue)));
                }
            } else {
                // There are two things going on here.
                //     1 - When we are running a program, we want all incoming lines to be pushed to the terminal
                //     2 - Except the very first 'OK'. There are timing issues and this was the best place to catch it.
                //            This makes the user output look a lot nicer without the 'OK' showing up.
                if (this.specialForceOutputFlag) {
                    if (this.catchOk) {
                        const v = this.textDecoder.decode(values);
                        if (v.startsWith('OK')) {
                            this.catchOk = false;
                            this.onData(v.slice(2));
                        } else {
                            this.onData(this.textDecoder.decode(values));
                        }
                    } else {
                        this.onData(this.textDecoder.decode(values));
                    }
                }

                this.collectedData += this.textDecoder.decode(values);

                // If raw flag set true, collect raw data for now
                if (this.isCollectedRawData == true) {
                    for (let i = 0; i < values.length; i++) {
                        this.collectedRawData.push(values[i]);
                    }
                }
            }
        }
    }

    /**
     * onData - data received from XRP
     * @param data 
     */
    public onData(data: string) {
        this.connLogger.debug('Received data from XRP: ' + data);
    }

    //TODO: not sure what this functions does???
    startCollectRawData() {
        this.isCollectedRawData = true;
        this.collectedRawData = [];
    }

    //TODO: not sure what this functions does???
    endCollectRawData() {
        this.isCollectedRawData = false;
    }

    startReaduntil(str: string) {
        this.readUntilStr = str;
        this.collectedData = '';
    }

    // Will stall js until finds line set by startReaduntil().
    // Providing an offset will skip subsequent lines after the
    // found line set by startReaduntil.
    // Loops forever if never finds line set by startReaduntil()
    async haltUntilRead(omitOffset: number = 0, waitTime: number = -1): Promise<string[]> {
        let waitOmitOffset = 0;
        let numTimes = waitTime;

        // Re-evaluate collected data for readUntil line every 85ms
        while (this.connectionStates === ConnectionState.Connected && numTimes != 0) {
            const tempLines = this.collectedData.split('\r\n');

            for (let i = 0; i < tempLines.length; i++) {
                if (
                    tempLines[i] == this.readUntilStr ||
                    this.readUntilStr == '' ||
                    tempLines[i].indexOf(this.readUntilStr) != -1 ||
                    tempLines[i] == '>'
                ) {
                    // Keyboard interrupt
                    // Wait for omitOffset lines
                    if (i > tempLines.length - omitOffset && waitOmitOffset < 5) {
                        waitOmitOffset++;
                        break;
                    }
                    this.readUntilStr = '';

                    // Output the rest of the lines that should not be hidden
                    // Should find a way to do this without adding newlines again

                    for (let j = i + omitOffset; j < tempLines.length; j++) {
                        if (j != tempLines.length - 1) {
                            this.onData?.(tempLines[j] + '\r\n');
                        } else {
                            this.onData?.(tempLines[j]);
                        }
                    }

                    return tempLines.slice(0, i + omitOffset); // Return all lines collected just before the line that switched off haltUntil()
                }
            }
            await new Promise((resolve) => setTimeout(resolve, 85));
            if (waitTime != -1) {
                numTimes--;
            }
        }
        return [];
    }

    private async softReset() {
        return;
        //this.startReaduntil("MPY: soft reboot");
        //await this.writeToDevice(this.CTRL_CMD_SOFTRESET);
        //await this.haltUntilRead(3);
    }

    private async getToRaw() {
        this.startReaduntil('raw REPL; CTRL-B to exit');
        // Refer to pyboard.py for "\r" https://github.com/micropython/micropython/blob/master/tools/pyboard.py#L326-L334
        await this.writeToDevice('\r' + this.CTRL_CMD_KINTERRUPT + this.CTRL_CMD_KINTERRUPT); // ctrl-C twice: interrupt any running program
        await this.writeToDevice('\r' + this.CTRL_CMD_RAWMODE);
        await this.haltUntilRead(2);

        await this.softReset();
    }

    // Wait until an OK is received, else write ctrl-c since raw sometimes gets stuck? Seems to work for upload files
    private async waitUntilOK() {
        let times = 0;

        while (this.connectionStates === ConnectionState.Connected) {
            const tempLines = this.collectedData.split('\r\n');

            for (let i = 0; i < tempLines.length; i++) {
                if (tempLines[i] == 'OK' || tempLines[i] == '>') {
                    return;
                }
            }

            times = times + 1;
            if (times >= 20) {
                return;
            }
            await new Promise((resolve) => setTimeout(resolve, 5));
        }
    }

    // https://github.com/micropython/micropython/blob/master/tools/pyboard.py#L325
    public async getToNormal(omitOffset: number = 0) {
        await this.getToRaw(); // Get to raw first so that unwanted messages are not printed (like another intro message)

        //this.startReaduntil("Raspberry Pi Pico W with RP2040");
        this.startReaduntil('MicroPython');
        //this.startReaduntil("information.");
        // https://github.com/micropython/micropython/blob/master/tools/pyboard.py#L360 for "\r"
        await this.writeToDevice('\r' + this.CTRL_CMD_NORMALMODE);
        await this.haltUntilRead(omitOffset);
    }


    /**
     * writeToDevice - write data to device
     * @param str 
     */
    public async writeToDevice(str: string | Uint8Array) {
        this.connLogger.debug('Writing to device' + str);
    }

    // Goes into raw mode and writes a command according to the THUMBY_SEND_BLOCK_SIZE then executes
    public async writeUtilityCmdRaw(
        cmdStr: string,
        waitForCmdEnd: boolean = false,
        omitAmount: number = 0,
        customWaitForStr: string = '>',
    ): Promise<string[] | undefined> {
        // Get into raw mode
        await this.getToRaw();

        // Send the cmd string
        const numberOfChunks = Math.ceil(cmdStr.length / this.XRP_SEND_BLOCK_SIZE) + 1;
        for (let b = 0; b < numberOfChunks; b++) {
            const writeDataCMD = cmdStr.slice(
                b * this.XRP_SEND_BLOCK_SIZE,
                (b + 1) * this.XRP_SEND_BLOCK_SIZE,
            );
            console.log(writeDataCMD);
            await this.writeToDevice(writeDataCMD);
        }

        if (waitForCmdEnd) {
            this.startReaduntil(customWaitForStr);
            await this.writeToDevice(this.CTRL_CMD_SOFTRESET);
            if (customWaitForStr == '>') await this.waitUntilOK();
            return await this.haltUntilRead(omitAmount, 300); //added timeout since micropython 1.19 sometimes will not get the soft reset and hang
        } else {
            await this.writeToDevice(this.CTRL_CMD_SOFTRESET);
        }
        return;
    }

    /**
     * isBusy
     * @returns 
     */
    public isBusy(): boolean {
        return this.connectionStates === ConnectionState.Busy;
    }
}

export default Connection;