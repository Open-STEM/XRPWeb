import ConnectionMgr from '@/managers/connectionmgr';
import { ConnectionType } from '@/utils/types';
import Connection, { ConnectionState } from '@connections/connection';

/**
 * BluetoothConnection class
 * 
 * This class is responsible for establish a bluetooth connection with the XRP Robot
 */
export class BluetoothConnection extends Connection {
    //bluetooth information
    private bleDevice: BluetoothDevice | undefined;
    private btService: BluetoothRemoteGATTService | undefined;
    private bleReader: BluetoothRemoteGATTCharacteristic | undefined;
    private bleWriter: BluetoothRemoteGATTCharacteristic | undefined;

    // UUIDs for standard NORDIC UART service and characteristics
    private readonly UART_SERVICE_UUID: string = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
    private readonly TX_CHARACTERISTIC_UUID: string = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
    private readonly RX_CHARACTERISTIC_UUID: string = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
    private bleDisconnectTime: number = 0;

    // bluetooth data
    private bleData: Uint8Array | null = null;
    private bleDataResolveFunc: ((value: Uint8Array) => void) | null = null;

    private readonly BLE_STOP_MSG  = "##XRPSTOP##"


    constructor(connMgr: ConnectionMgr) {
        super();
        this.connMgr = connMgr;
    }

    /**
     * connectWithTimeout - try to reconnect with timeout
     * @param device
     * @param timeoutMs
     * @returns
     */
    private connectWithTimeout(
        device: BluetoothDevice,
        timeoutMs: number,
    ): Promise<BluetoothRemoteGATTServer> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Connection timed out'));
            }, timeoutMs);

            device
                .gatt!.connect()
                .then((server) => {
                    clearTimeout(timeoutId);
                    resolve(server);
                })
                .catch((err) => {
                    clearTimeout(timeoutId);
                    reject(err);
                });
        });
    }

    /**
     * startBLEData
     */
    startBLEData() {
        // Set up the event listener for the RX characteristic
        this.bleReader!.addEventListener('characteristicvaluechanged', (event) => {
            const charEvent = event as Event & { target: BluetoothRemoteGATTCharacteristic };
            const value = charEvent.target.value;
            //if(this.DEBUG_CONSOLE_ON) this.connLogger.debug(this.TEXT_DECODER.decode(value));
            if (this.bleData == undefined) {
                this.bleData = new Uint8Array(value!.buffer); //just in case the resolve is not ready
            } else {
                this.bleData = this.concatUint8Arrays(
                    this.bleData,
                    new Uint8Array(value!.buffer),
                );
            }
            if (this.bleDataResolveFunc) {
                this.bleDataResolveFunc(this.bleData);
                this.bleDataResolveFunc = null;
                this.bleData = new Uint8Array(0);
            }
            //let str = arrayBufferToString(value.buffer); // Convert ArrayBuffer to string
            //resolve(new Uint8Array(value.buffer)); // Resolve the promise with the received string
        });
        // Optional: Reject the promise on some condition, e.g., timeout or error
    }

    /**
     * getBLEData - received BLE data from XRP Robot
     * @param timeout 
     * @returns 
     */
    async getBLEData(timeout = 1000): Promise<Uint8Array | undefined> {
        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                this.bleDataResolveFunc = null; // Clear reference
                resolve(undefined);
            }, timeout);

            this.bleDataResolveFunc = (data) => {
                clearTimeout(timeoutId); // Prevent timeout from resolving
                resolve(data);
            };
        });
    }


    /**
     * readWorker - this worker read data from the XRP robot
     */
    async readWorker() {
        while (this.connectionStates === ConnectionState.Connected) {
            this.startBLEData();
            try {
                while (true) {
                    let values: Uint8Array | undefined = undefined;
                    values = await this.getBLEData();
                    this.readData(values);
                }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch(err: any) {
                throw new Error('read work exception: ' + err.message);
            }
        }
    }

    /**
     * onConnected
     */
    private async onConnected() {
        this.connectionStates = ConnectionState.Connected;
        //TODO:  start the read looad
        this.lastProgramRan = undefined;
        if (this.connLogger) {
            this.connMgr?.connectCallback(this.connectionStates, ConnectionType.BLUETOOTH);
        }
        this.readWorker();
        //await this.getToNormal();
    }

    /**
     * onDisconnected
     */
    private onDisconnected() {
        this.connectionStates = ConnectionState.Disconnected;
        if (this.connLogger) {
            this.connMgr?.connectCallback(this.connectionStates, ConnectionType.BLUETOOTH);
        }
    }

    /**
     * isConnected - query connection status
     */
    isConnected(): boolean {
        return this.connectionStates === ConnectionState.Connected;
    }

    /**
     * connect - connecting BLE device
     * @returns
     */
    public async connect(): Promise<void> {
        this.connLogger.debug('Conneting BLE device');
        this.bleDisconnectTime = Date.now();

        this.connectionStates = ConnectionState.Busy;
        //this.MANNUALLY_CONNECTING = true;

        this.bleDevice = undefined; //just in case we were connected before.

        const elapseTime = (Date.now() - (this.bleDisconnectTime)) / 1000;
        if (elapseTime > 60) {
            this.connLogger.debug(elapseTime);
            //await window.alertMessage("Error while detecting bluetooth devices. \nPlease refresh the browser and try again.");
            //TODO: Warn of need to refresh
            return;
        }

        // Function to connect to the device
        await navigator.bluetooth
            .requestDevice({
                filters: [
                    {
                        namePrefix: 'XRP',
                    },
                ],
                optionalServices: [this.UART_SERVICE_UUID],
            })
            .then(async (device) => {
                this.connLogger.info('Connecting to device...');
                this.bleDevice = device;
                if (device.gatt?.connected) {
                    console.log("Reconnecting...");
                    await device.gatt!.disconnect();
                }
                return device.gatt!.connect();
            })
            .then((servers) => {
                this.connLogger.info('Getting UART Service...');
                return servers.getPrimaryService(this.UART_SERVICE_UUID);
            })
            .then((btService) => {
                this.btService = btService;
                this.connLogger.info('Getting TX Characteristic...');
                return btService.getCharacteristic(this.TX_CHARACTERISTIC_UUID);
            })
            .then((characteristic) => {
                this.connLogger.info('Connected to TX Characteristic');
                this.bleWriter = characteristic;
                //this.connLogger.debug('Getting RX Characteristic...');
                return this.btService!.getCharacteristic(this.RX_CHARACTERISTIC_UUID);
                // Now you can use the characteristic to send data
            })
            .then((characteristic) => {
                this.bleReader = characteristic;
                //this.READBLE.addEventListener('characteristicvaluechanged', this.readloopBLE);
                this.bleReader!.startNotifications();
                this.bleDevice!.addEventListener('gattserverdisconnected', () => {
                    this.disconnect();
                });
                this.onConnected();
            })
            .catch((error) => {
                if (error.code === 8) {
                    this.connLogger.info(error.message);
                    this.onDisconnected();
                } else {
                    throw new Error('BLE connection failed' + error.message);
                }
            });

        //this.MANNUALLY_CONNECTING = false;
        this.connLogger.debug('Existing BLE connect');
    }

    public async disconnect(): Promise<void> {
        this.connLogger.info('Entering BLE disconnect');
        this.bleDisconnectTime = Date.now();
        this.bleWriter = undefined;
        this.bleReader = undefined;
        this.connectionStates = ConnectionState.Disconnected; // Will stop certain events and break any EOT waiting functions
        //TODO: handle UI state here???
        // if (!this.STOP) { //If they pushed the STOP button then don't make it look disconnected it will be right back
        //     //this.onDisconnect?.();
        //     this.connLogger.debug("bleDisconnect - they didn't press STOP")
        // }
        //this.SPECIAL_FORCE_OUTPUT_FLAG = false;
        //TODO: These are UI states - should we kept in the connection logics?
        // this.RUN_BUSY = false;
        // this.STOP = false;
        this.reconnect();
    }

    private async reconnect() {
        this.connLogger.info('Entering reconnect');
        if (this.connectionStates === ConnectionState.Disconnected) {
            try {
                const server = await this.connectWithTimeout(this.bleDevice!, 10000); //wait for 10seconds to see if it reconnects
                //const server = await this.BLE_DEVICE.gatt.connect();
                this.btService = await server.getPrimaryService(this.UART_SERVICE_UUID);
                //this.connLogger.debug('Getting TX Characteristic...');
                this.bleWriter = await this.btService.getCharacteristic(
                    this.TX_CHARACTERISTIC_UUID,
                );
                this.bleReader = await this.btService.getCharacteristic(
                    this.RX_CHARACTERISTIC_UUID,
                );
                this.bleReader.startNotifications();
                this.onConnected();
                return true;
                // Perform operations after successful connection
            } catch (error) {
                this.connLogger.debug('timed out: ', error);
                this.bleDevice = undefined;
                this.onDisconnected();
                //throw new Error('Failed BLE reconnect' + error); TODO: I don't think we want to throw an error here
            }
        }
        this.connLogger.info('Existing reconnect');
    }

    private str2ab(str: string): ArrayBuffer {
        const buf = new ArrayBuffer(str.length);
        const bufView = new Uint8Array(buf);
        for (let i = 0, strLen = str.length; i < strLen; i++) bufView[i] = str.charCodeAt(i);
        return buf;
    }

    /**
     * writeToDevice
     * @param str 
     */
    public async writeToDevice(str: string | Uint8Array) {
        this.connLogger.debug('writeToDevice BLE: ' + str);

        try {
            if (typeof str == 'string') {
                //this.connLogger.debug("writing: " + str);
                await this.bleQueue(this.str2ab(str));
            } else {
                //this.connLogger.debug("writing: " + this.TEXT_DECODER.decode(str));
                await this.bleQueue(str);
            }
        } catch (error) {
            this.connLogger.debug(error);
        }
    }

    /**
     *  bleQueue - If we haven't come back from the ble.writeValue then the GATT is still busy and we will miss items that are being sent
     * This can be seen if you type very fast in the Shell 
     */
    private Queue:Promise<void> = Promise.resolve();
    private async  bleQueue(value: BufferSource){
        this.Queue = this.Queue.then(async () => {
            try {
                await this.bleWriter?.writeValue(value);
            } catch (error) {
                console.error('ble write failed:', error);
            }
        });
    }

    public async getToREPL():Promise<boolean>{
        this.connLogger.info("BLE getToREPL")
        if(await this.checkPrompt()){
            return true;
        }
        await this.writeToDevice(this.BLE_STOP_MSG);
        return true;
    }
}
