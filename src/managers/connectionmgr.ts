import AppMgr, { EventType } from '@/managers/appmgr';
import { ConnectionCMD } from '@/utils/types';
import Connection, { ConnectionState } from '@/connections/connection';
import { USBConnection } from '@/connections/usbconnection';
import { BluetoothConnection } from '@/connections/bluetoothconnection';
import { CommandToXRPMgr } from './commandstoxrpmgr';


/**
 * ConnectionMgr - manages USB and Bluetooth connection to the XRP Robot
 */
export default class ConnectionMgr {
    private appMgr: AppMgr;
    private cmdToXRPMgr: CommandToXRPMgr = CommandToXRPMgr.getInstance();
    private connection: Connection | null = null;

    constructor(appMgr: AppMgr) {
        this.appMgr = appMgr;

        // To support auto connect to USB connection, the USBConnection needs to be always instantiated during startup
        // When a user has used the USB connection previously, it will auto connect without the user clicking the
        // connection button.
        this.connection = new USBConnection(this.connectCallback);
        this.cmdToXRPMgr.setConnection(this.connection);

        /*** Listen for Subscriptions ***/
        this.appMgr.on(EventType.EVENT_CONNECTION, (subType: string) => {
            console.log("Connection manager event, sub type: " + subType);
            switch(subType){
                case ConnectionCMD.CONNECT_USB:
                    if (this.connection === null) {
                        this.connection = new USBConnection(this.connectCallback);
                        this.connection.connect();
                    } else if (this.connection) {
                        this.connection.connect();
                        this.cmdToXRPMgr.setConnection(this.connection);
                    }
                    break;
                case ConnectionCMD.CONNECT_BLUETOOTH:
                    this.connection = new BluetoothConnection(this.connectCallback);
                    this.connection.connect();
                    this.cmdToXRPMgr.setConnection(this.connection);
                    break;
            }
        });
    }

    /**
     * connectCallback
     */
    private async connectCallback(state: ConnectionState) {
        if (this.connection) {
            this.cmdToXRPMgr.setConnection(this.connection);
        }

        if (state === ConnectionState.Connected) {
            console.log(await CommandToXRPMgr.getInstance().batteryVoltage());
            console.log(await CommandToXRPMgr.getInstance().getVersionInfo());
            await CommandToXRPMgr.getInstance().getOnBoardFSTree();
        this.appMgr.emit(EventType.EVENT_CONNECTION_STATUS, ConnectionState.Connected.toString());
        } else if (state === ConnectionState.Disconnected) {
            this.appMgr.emit(EventType.EVENT_CONNECTION_STATUS, ConnectionState.Disconnected.toString());
        }
    }
    
    /**
     * getConnection
     * @returns Connection object or null
     */
    public getConnection(): Connection | null {
        return this.connection;
    }
}
