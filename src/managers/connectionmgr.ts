import AppMgr, { EventType } from '@/managers/appmgr';
import { ConnectionCMD, ConnectionType } from '@/utils/types';
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
    private connections: Connection[] = [];
    private activeConnection: Connection | null = null;

    constructor(appMgr: AppMgr) {
        this.appMgr = appMgr;

        // To support auto connect to USB connection, the USBConnection needs to be always instantiated during startup
        // When a user has used the USB connection previously, it will auto connect without the user clicking the
        // connection button.
        this.connections[ConnectionType.USB] = new USBConnection(this);
        this.cmdToXRPMgr.setConnection(this.connections[ConnectionType.USB]);
        this.activeConnection = this.connections[ConnectionType.USB];

        // Instantiate the Bluetooth Connection
        this.connections[ConnectionType.BLUETOOTH] = new BluetoothConnection(this);

        /*** Listen for Subscriptions ***/
        this.appMgr.on(EventType.EVENT_CONNECTION, (subType: string) => {
            console.log("Connection manager event, sub type: " + subType);
            switch(subType){
                case ConnectionCMD.CONNECT_USB:
                    if (this.connections[ConnectionType.USB]) {
                        this.connections[ConnectionType.USB].connect();
                        this.cmdToXRPMgr.setConnection(this.connections[ConnectionType.USB]);
                    }
                    break;
                case ConnectionCMD.CONNECT_BLUETOOTH:
                    if (this.connections[ConnectionType.BLUETOOTH]) {
                        this.connections[ConnectionType.BLUETOOTH].connect();
                        this.cmdToXRPMgr.setConnection(this.connections[ConnectionType.BLUETOOTH]);
                    }
                    break;
            }
        });
    }

    /**
     * connectCallback
     */
    public async connectCallback(state: ConnectionState, connType: ConnectionType) {
        this.activeConnection = this.connections[connType];
        if (state === ConnectionState.Connected) {
            this.appMgr.emit(EventType.EVENT_CONNECTION_STATUS, ConnectionState.Connected.toString());
            await this.cmdToXRPMgr.getOnBoardFSTree();
        } else if (state === ConnectionState.Disconnected) {
            this.appMgr.emit(EventType.EVENT_CONNECTION_STATUS, ConnectionState.Disconnected.toString());
        }
    }
    
    /**
     * getConnection
     * @returns Connection object or null
     */
    public getConnection(): Connection | null {
        return this.activeConnection;
    }
}
