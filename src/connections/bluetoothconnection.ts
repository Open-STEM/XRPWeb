import ConnectionMgr from '@/managers/connectionmgr';
import { ConnectionType } from '@/utils/types';
import Connection, { ConnectionState } from '@connections/connection';
import TableMgr from '@/managers/tablemgr';
import AppMgr, { EventType } from '@/managers/appmgr';
import {
    bluetoothRequestFilters,
    getRememberedXrp,
    matchPermittedBluetoothDevice,
    saveRememberedBleDeviceId,
} from '@/utils/rememberedxrp';

export type BluetoothConnectOptions = {
    xrpId?: string;
    showAll?: boolean;
};

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
    private bleDataReader: BluetoothRemoteGATTCharacteristic | undefined;
    private bleDataWriter: BluetoothRemoteGATTCharacteristic | undefined;

    // UUIDs for standard NORDIC UART service and characteristics
    private readonly UART_SERVICE_UUID: string = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
    private readonly TX_CHARACTERISTIC_UUID: string = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
    private readonly RX_CHARACTERISTIC_UUID: string = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
    private readonly DATA_TX_CHARACTERISTIC_UUID: string = '92ae6088-f24d-4360-b1b1-a432a8ed36ff';
    private readonly DATA_RX_CHARACTERISTIC_UUID: string = '92ae6088-f24d-4360-b1b1-a432a8ed36fe';

    //private bleDisconnectTime: number = 0;

    // bluetooth data
    private bleData: Uint8Array | null = null;
    private bleDataResolveFunc: ((value: Uint8Array) => void) | null = null;
    private ble2Data: Uint8Array | null = null;
    private ble2DataResolveFunc: ((value: Uint8Array) => void) | null = null;

    private readonly BLE_STOP_MSG  = "##XRPSTOP##"
    private reconnectSuccess: boolean = true;
    private readWorkerRunning: boolean = false;
    private lastConnectCancelled: boolean = false;

    // Devices the user has already picked in this page session, keyed by XRP id.
    // navigator.bluetooth.getDevices() is behind a Chrome flag, so holding the
    // BluetoothDevice is the only way to reconnect without the chooser.
    private permittedDevices: Map<string, BluetoothDevice> = new Map();

    private  Table: TableMgr | undefined = undefined;

    constructor(connMgr: ConnectionMgr) {
        super();
        this.connMgr = connMgr;
        if(this.joyStick)
            this.joyStick.writeToDevice = this.writeToDataDevice.bind(this);
        this.Table = new TableMgr();
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

            if(device.gatt?.connected){
                device.gatt!.disconnect();
            }
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
            if (this.bleData == null) {
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

        if(this.bleDataReader != undefined){
            this.bleDataReader!.addEventListener('characteristicvaluechanged', (event) => {
                const charEvent = event as Event & { target: BluetoothRemoteGATTCharacteristic };
                const value = charEvent.target.value;
                //if(this.DEBUG_CONSOLE_ON) this.connLogger.debug(this.TEXT_DECODER.decode(value));
                if (this.ble2Data == null) {
                    this.ble2Data = new Uint8Array(value!.buffer); //just in case the resolve is not ready
                } else {
                    this.ble2Data = this.concatUint8Arrays(
                        this.ble2Data,
                        new Uint8Array(value!.buffer),
                    );
                }
                if (this.ble2DataResolveFunc) {
                    this.ble2DataResolveFunc(this.ble2Data);
                    this.ble2DataResolveFunc = null;
                    this.ble2Data = new Uint8Array(0);
                }
                //let str = arrayBufferToString(value.buffer); // Convert ArrayBuffer to string
                //resolve(new Uint8Array(value.buffer)); // Resolve the promise with the received string
            });
        }

    }

    /**
     * getBLEData - received BLE data from XRP Robot
     * @param timeout 
     * @returns 
     */
    async getBLEData(timeout = 10): Promise<Uint8Array | undefined> {
        return new Promise((resolve) => {
            if(this.bleData != null && this.bleData?.length > 0){
                const data = this.bleData;
                this.bleData = null;
                resolve(data);
            }
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
     * get2BLEData - received BLE data from the bleDataReader from XRP Robot
     * @param timeout 
     * @returns 
     */
    async get2BLEData(timeout = 10): Promise<Uint8Array | undefined> {
        return new Promise((resolve) => {
            if(this.ble2Data != null && this.ble2Data?.length > 0){
                const data = this.ble2Data;
                this.ble2Data = null;
                resolve(data);
            }
            const timeoutId = setTimeout(() => {
                this.ble2DataResolveFunc = null; // Clear reference
                resolve(undefined);
            }, timeout);

            this.ble2DataResolveFunc = (data) => {
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
            this.readWorkerRunning = true;
            this.startBLEData();
            try {
                while (true) {
                    let values: Uint8Array | undefined = undefined;
                    values = await this.getBLEData();
                    this.readData(values);
                
                    let valuesD: Uint8Array | undefined = undefined;
                    if(this.bleDataReader != undefined){
                        valuesD = await this.get2BLEData();
                        if(valuesD != undefined) {
                            // Extract complete XPP packets and only process those
                            // Note: regularData is ignored since bleDataReader only receives XPP packets
                            const { packets } = this.extractCompleteXPPPackets(valuesD);
                            for (const packet of packets) {
                                this.processXPPPacket(packet, this.Table);
                            }
                        }
                    }
                
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
        this.lastProgramRan = undefined;
        if (this.connMgr) { 
            this.connMgr?.connectCallback(this.connectionStates, ConnectionType.BLUETOOTH);
        }
        if(!this.readWorkerRunning){  // if the read worker is not running then restart it  
            this.readWorker();
        }
        else{
            this.startBLEData(); // the readers may have been updated so start them again
        }
        //await this.getToNormal();
    }

    /**
     * onDisconnected
     */
    private onDisconnected() {
        this.connectionStates = ConnectionState.Disconnected;
        if (this.connLogger) { //BUGBUG: why is this dependent on the connLogger?
            this.connMgr?.connectCallback(this.connectionStates, ConnectionType.BLUETOOTH);
        }
    }

    /**
     * isConnected - query connection status
     */
    isConnected(): boolean {
        return this.connectionStates === ConnectionState.Connected;
    }

    public getDeviceId(): string | undefined {
        return this.bleDevice?.id;
    }

    public wasLastConnectCancelled(): boolean {
        return this.lastConnectCancelled;
    }

    /**
     * rememberPermittedDevice - cache a user-picked device for this page session
     */
    private rememberPermittedDevice(xrpId: string | undefined, device: BluetoothDevice): void {
        const key = xrpId ?? this.xrpIdFromDeviceName(device.name);
        if (key) {
            this.permittedDevices.set(key.toLowerCase(), device);
        }
        // Only the default robot's device id is persisted; pairing with any
        // other XRP must not repoint the stored default.
        const remembered = getRememberedXrp();
        if (key && remembered?.xrpId.toLowerCase() === key.toLowerCase()) {
            saveRememberedBleDeviceId(device.id);
        }
    }

    private xrpIdFromDeviceName(name: string | null | undefined): string | undefined {
        const match = /^XRP-(.+)$/i.exec(name ?? '');
        return match ? match[1] : undefined;
    }

    /**
     * hasPermittedDevice - can we connect to this robot without the chooser?
     */
    public hasPermittedDevice(xrpId: string): boolean {
        return this.permittedDevices.has(xrpId.toLowerCase());
    }

    /**
     * findKnownDevice - previously permitted robot; never opens the OS chooser.
     */
    private async findKnownDevice(xrpId: string): Promise<BluetoothDevice | undefined> {
        const cached = this.permittedDevices.get(xrpId.toLowerCase());
        if (cached) {
            this.connLogger.info(`Reusing permitted device from this session: ${cached.id}`);
            return cached;
        }
        // getDevices() only exists behind chrome://flags/#enable-experimental-web-platform-features.
        if (!navigator.bluetooth || typeof navigator.bluetooth.getDevices !== 'function') {
            this.connLogger.info(
                'navigator.bluetooth.getDevices() unavailable; the chooser is required once per page load',
            );
            return undefined;
        }
        const remembered = getRememberedXrp();
        try {
            let devices = await navigator.bluetooth.getDevices();
            this.connLogger.info(
                `getDevices: ${devices.length} permitted, names=${devices.map((d) => d.name || '(none)').join(',')}`,
            );
            const matchOptions = { xrpId, bleDeviceId: remembered?.bleDeviceId };
            let known = matchPermittedBluetoothDevice(devices, matchOptions);
            if (!known && devices.length > 0) {
                // Kept short: the chooser fallback still needs the click's
                // transient user activation, which expires after a few seconds.
                await this.refreshAdvertisedNames(devices, 1500);
                devices = await navigator.bluetooth.getDevices();
                known = matchPermittedBluetoothDevice(devices, matchOptions);
            }
            if (known) {
                this.rememberPermittedDevice(xrpId, known);
            }
            return known;
        } catch (error) {
            this.connLogger.debug(error);
            return undefined;
        }
    }

    /**
     * Chrome often leaves BluetoothDevice.name empty until advertisements are watched.
     */
    private async refreshAdvertisedNames(
        devices: BluetoothDevice[],
        timeoutMs: number,
    ): Promise<void> {
        const watchable = devices.filter(
            (device) => typeof device.watchAdvertisements === 'function',
        );
        if (watchable.length === 0) {
            return;
        }
        await Promise.race([
            Promise.all(
                watchable.map(
                    (device) =>
                        new Promise<void>((resolve) => {
                            const timer = window.setTimeout(() => resolve(), timeoutMs);
                            const onAd = () => {
                                window.clearTimeout(timer);
                                resolve();
                            };
                            device.addEventListener('advertisementreceived', onAd);
                            device.watchAdvertisements().catch(() => {
                                window.clearTimeout(timer);
                                resolve();
                            });
                        }),
                ),
            ),
            new Promise<void>((resolve) => {
                window.setTimeout(resolve, timeoutMs);
            }),
        ]);
    }

    /**
     * resolveDevice - pick a BLE device with getDevices() or the OS chooser.
     * Must run in a user-gesture stack when the chooser is needed.
     */
    public async resolveDevice(
        options?: BluetoothConnectOptions,
    ): Promise<BluetoothDevice | undefined> {
        this.lastConnectCancelled = false;
        const useExact = Boolean(options?.xrpId) && !options?.showAll;

        if (useExact && options?.xrpId) {
            const known = await this.findKnownDevice(options.xrpId);
            if (known) {
                this.connLogger.info(`Using permitted device ${known.id} (${known.name ?? 'unnamed'})`);
                return known;
            }
        }

        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: bluetoothRequestFilters(options),
                optionalServices: [this.UART_SERVICE_UUID],
            });
            this.rememberPermittedDevice(options?.xrpId, device);
            return device;
        } catch (error) {
            this.lastConnectCancelled = true;
            this.connLogger.info(error);
            return undefined;
        }
    }

    /**
     * connectToDevice - GATT setup for an already-chosen BluetoothDevice
     */
    public async connectToDevice(device: BluetoothDevice): Promise<boolean> {
        this.lastConnectCancelled = false;
        this.connectionStates = ConnectionState.Busy;
        this.bleDevice = device;
        this.rememberPermittedDevice(undefined, device);
        this.connLogger.info('Connecting to device...');
        AppMgr.getInstance().emit(EventType.EVENT_SHOWBLUETOOTH_CONNECTING, 'show-bluetooth-connecting');

        try {
            const servers = await this.connectWithTimeout(device, 10000);
            this.connLogger.info('Getting UART Service...');
            const btService = await servers.getPrimaryService(this.UART_SERVICE_UUID);
            this.btService = btService;
            this.connLogger.info('Getting TX Characteristic...');
            this.bleWriter = await btService.getCharacteristic(this.TX_CHARACTERISTIC_UUID);
            this.connLogger.info('Connected to TX Characteristic');
            this.bleReader = await btService.getCharacteristic(this.RX_CHARACTERISTIC_UUID);
            this.connLogger.info('Connected to RX Characteristic');
            try {
                this.bleDataWriter = await btService.getCharacteristic(this.DATA_TX_CHARACTERISTIC_UUID);
                this.connLogger.info('Connected to DATA TX Characteristic');
                this.bleDataReader = await btService.getCharacteristic(this.DATA_RX_CHARACTERISTIC_UUID);
                this.connLogger.info('Connected to DATA RX Characteristic');
                await this.bleReader.startNotifications();
                await this.bleDataReader.startNotifications();
            } catch (error) {
                const err = error as { code?: number; message?: string };
                if (
                    err.code === 8 &&
                    (err.message?.includes(this.DATA_RX_CHARACTERISTIC_UUID) ||
                        err.message?.includes(this.DATA_TX_CHARACTERISTIC_UUID))
                ) {
                    this.connLogger.info(err.message);
                    await this.bleReader.startNotifications();
                } else {
                    throw error;
                }
            }
            this.bleDevice.addEventListener('gattserverdisconnected', () => {
                this.disconnect();
            });
            this.onConnected();
            this.connLogger.debug('Exiting BLE connect');
            return true;
        } catch (error) {
            this.connLogger.info(error);
            AppMgr.getInstance().emit(
                EventType.EVENT_HIDE_BLUETOOTH_CONNECTING,
                'hide-bluetooth-connecting',
            );
            this.onDisconnected();
            return false;
        }
    }

    /**
     * connect - connecting BLE device. When xrpId is set and showAll is not,
     * tries a previously permitted device then an exact-name picker.
     */
    public async connect(options?: BluetoothConnectOptions): Promise<boolean> {
        this.connLogger.debug('Conneting BLE device');
        this.connectionStates = ConnectionState.Busy;

        const device = await this.resolveDevice(options);
        if (!device) {
            this.connectionStates = ConnectionState.Disconnected;
            return false;
        }
        return await this.connectToDevice(device);
    }

    public async disconnect(): Promise<void> {
        this.connLogger.info('Entering BLE disconnect');
        //this.bleDisconnectTime = Date.now();
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
            
                this.bleDataWriter = await this.btService.getCharacteristic(
                    this.DATA_TX_CHARACTERISTIC_UUID,
                );
                this.bleDataReader = await this.btService.getCharacteristic(
                    this.DATA_RX_CHARACTERISTIC_UUID,
                );

                this.bleReader.startNotifications();
                this.bleDataReader.startNotifications();
                await this.onConnected();
                this.reconnectSuccess = true;
                
                //return true;
                // Perform operations after successful connection
            } catch (error) {
                if (error instanceof Error) {
                    this.connLogger.debug(`timed out:  ${error.stack ?? error.message}`);
                }
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
                await this.bleQueue(str as BufferSource);
            }
        } catch (error) {
            this.connLogger.debug(error);
        }
    }

     /**
     * writeToDataDevice
     * @param Uint8Array 
     */
     public async writeToDataDevice(data: Uint8Array) {
        this.connLogger.debug('writeToDataDevice BLE: ' + data);

        try {
            //this.connLogger.debug("writing: " + this.TEXT_DECODER.decode(str));
            await this.bleDataWriter?.writeValue(data as BufferSource);
            
        } catch (error) {
            this.connLogger.debug(error);
        }

        return Promise.resolve(); // Indicate success
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
            //this.connLogger.info("BLE getToREPL: checkPrompt succeeded");
            return true;
        }

        if(!this.reconnectSuccess){
            //this.connLogger.info("BLE getToREPL: leaving nothing done");
            return false;
        }
        // Need to send BLE_STOP_MSG, this causes the XRP to reboot so we need to wait for reconnect to complete.
        // Return false so the caller does not treat the connection as finished (and dismiss the
        // connecting spinner) until onConnected runs again after reconnect.
        this.reconnectSuccess = false;
        await this.writeToDevice(this.BLE_STOP_MSG);
        return false;
    }
}
