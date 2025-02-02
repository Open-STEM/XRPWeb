import AppMgr, { EventType } from '@/managers/appmgr';
import { ConnectionCMD } from '@/utils/types';
import Connection from '@/connections/connection';
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
        /*** Listen for Subscriptions ***/
        this.appMgr.on(EventType.EVENT_CONNECTION, (subType: string) => {
            console.log("Connection manager event, sub type: " + subType);
            switch(subType){
                case ConnectionCMD.CONNECT_USB:
                    this.connection = new USBConnection();
                    this.connection.connect(this.connectCallback);
                    this.cmdToXRPMgr.setConnection(this.connection);
                    break;
                case ConnectionCMD.CONNECT_BLUETOOTH:
                    this.connection = new BluetoothConnection();
                    this.connection.connect(this.connectCallback);
                    this.cmdToXRPMgr.setConnection(this.connection);
                    break;
            }
        });
    }

    /**
     * connectCallback
     */
    private async connectCallback() {
        console.log(await CommandToXRPMgr.getInstance().batteryVoltage());
        console.log(await CommandToXRPMgr.getInstance().getVersionInfo());
    }
    
    /**
     * getConnection
     * @returns Connection object or null
     */
    public getConnection(): Connection | null {
        return this.connection;
    }
}
