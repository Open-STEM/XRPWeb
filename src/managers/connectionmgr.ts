import AppMgr, { EventType } from '@/managers/appmgr';
import { ConnectionCMD, ConnectionType } from '@/utils/types';
import Connection, { ConnectionState } from '@/connections/connection';
import { USBConnection } from '@/connections/usbconnection';
import { BluetoothConnection } from '@/connections/bluetoothconnection';
import { CommandToXRPMgr } from './commandstoxrpmgr';
import PluginMgr from './pluginmgr';

/**
 * ConnectionMgr - manages USB and Bluetooth connection to the XRP Robot
 */
export default class ConnectionMgr {
    private appMgr: AppMgr;
    private cmdToXRPMgr: CommandToXRPMgr = CommandToXRPMgr.getInstance();
    private pluginMgr: PluginMgr = PluginMgr.getInstance();
    private connections: Connection[] = [];
    private activeConnection: Connection | null = null;

    private xrpID: string | undefined = undefined;

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
            console.log('Connection manager event, sub type: ' + subType);
            switch (subType) {
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
            if (await this.activeConnection.getToREPL()) {
                this.appMgr.emit(
                    EventType.EVENT_CONNECTION_STATUS,
                    ConnectionState.Connected.toString(),
                );
                await this.cmdToXRPMgr.getOnBoardFSTree();
                await this.activeConnection.getToNormal();
                if (connType == ConnectionType.USB) {
                    //if we connected via USB then we can release the BLE terminal
                    await this.cmdToXRPMgr.resetTerminal();
                }
                await this.cmdToXRPMgr.clearIsRunning();
                this.xrpID = await this.cmdToXRPMgr.checkIfNeedUpdate();
                this.IDSet(connType);
                
                // Check for plugins after connection is established
                await this.pluginMgr.pluginCheck();
                
                // After successufully connected to the bluetooth, hide the connecting dialog
                if (connType === ConnectionType.BLUETOOTH) {
                    AppMgr.getInstance().emit(EventType.EVENT_HIDE_BLUETOOTH_CONNECTING, 'hide-bluetooth-connecting');
                }
            }
        } else if (state === ConnectionState.Disconnected) {
            this.appMgr.emit(
                EventType.EVENT_CONNECTION_STATUS,
                ConnectionState.Disconnected.toString(),
            );
            // notify the folder tree to clear its data
            this.appMgr.emit(EventType.EVENT_FILESYS, '{}');
        }
    }

    IDSet = (connType: ConnectionType) => {
        //ID this would be a good spot to send window.xrpID to the database
        if (this.xrpID != undefined) {
            const isBLE = connType === ConnectionType.BLUETOOTH;
            const xrpType = this.cmdToXRPMgr.getXRPType();
            const data = {
                XRPID: this.xrpID.slice(-5),
                platform: 'XRP-react',
                BLE: isBLE,
                XRPType: xrpType,
            };

            // Send this information back to the WPI server
            try {
                fetch('https://xrpid-464879733234.us-central1.run.app/data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });
            } catch (err) {
                console.log(err);
            }
            // notify to display to the UI
            this.appMgr.emit(EventType.EVENT_ID, JSON.stringify(data));
        }
    };

    /**
     * publishConnectionInfo - (re)publish the connected XRP's identity (the ID
     * shown to the left of the RUN button).
     *
     * Some flows connect to the XRP outside the normal connect-button path —
     * notably the firmware install wizard, which reconnects after a reboot and
     * then soft-resets the board. In those cases the EVENT_ID may never have
     * been emitted (the reconnect can land before the board is ready to answer
     * a version query). Calling this once the board has settled fills the ID in.
     *
     * No-op when not connected. Re-queries the board only if the id is unknown.
     */
    public async publishConnectionInfo(): Promise<void> {
        const conn = this.activeConnection;
        if (!conn || !conn.isConnected()) {
            return;
        }
        const connType = conn instanceof USBConnection ? ConnectionType.USB : ConnectionType.BLUETOOTH;
        if (this.xrpID === undefined) {
            this.xrpID = await this.cmdToXRPMgr.checkIfNeedUpdate();
        }
        this.IDSet(connType);
    }

    /**
     * getConnection
     * @returns Connection object or null
     */
    public getConnection(): Connection | null {
        return this.activeConnection;
    }
}
