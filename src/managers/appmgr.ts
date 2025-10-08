import connecionMgr from '@/managers/connectionmgr';
import mitt from 'mitt';
import Connection from '@/connections/connection';
import { ConnectionType, EditorType, FolderItem } from '@/utils/types';
import { BluetoothConnection } from '@/connections/bluetoothconnection';
import GoogleAuthService from '@/services/google-auth';
import GoogleDriveService from '@/services/google-drive';

export enum Themes {
    DARK = 'dark',
    LIGHT = 'light'
}

export enum EventType {
    EVENT_FILESYS = 'filesys', // directoy tree from filesystem of the XRP
    EVENT_SHELL = 'shell', // shell updates from XRP
    EVENT_CONNECTION_STATUS = 'connection-status', // connection status updates
    EVENT_THEME = 'theme-change',    // System theme change event
    EVENT_CONNECTION = 'connection',
    EVENT_ID = 'id',    // XRP platform ID
    EVENT_EDITOR = 'editor', // editor events
    EVENT_OPEN_FILE = 'open-file', // open file event
    EVENT_EDITOR_LOAD = 'editor-load',  // loading data into editor
    EVENT_FONTCHANGE = 'font-change',   // change manoco editor fontsize
    EVENT_GENPYTHON = 'gen-python',     // change python requestion
    EVENT_GENPYTHON_DONE = 'gen-python-done',   // python code generation completed
    EVENT_SAVE_EDITOR = 'save-editor',          // save editor event
    EVENT_PROGRESS = 'progress',        // progressbar event
    EVENT_UPLOAD_DONE = 'progress-done',      // progress done event
    EVENT_MICROPYTHON_UPDATE = 'micropython-update',    // request micropythong update
    EVENT_MICROPYTHON_UPDATE_DONE = 'micropython-update-done',  // micropython update done
    EVENT_XRPLIB_UPDATE = 'xrplib-update',              // XRP update request
    EVENT_XRPLIB_UPDATE_DONE = 'xrplib-update-done',    // XRP update done
    EVENT_SHOWCHANGELOG = 'show-changelog', // show changelog
    EVENT_DASHBOARD_DATA = 'dashboard-data', // dashboard event
    EVENT_SHOWPROGRESS = 'show-progress', // show progress
    EVENT_PROGRESS_ITEM = 'progress-item', // show the item title for the progress display
    EVENT_FILESYS_STORAGE = 'filesys-storage', // storage capacity
    EVENT_MUST_UPDATE_MICROPYTHON = 'must-micropython-update', //If not an XRP version of MicroPython they must update before updating XRPLib
    EVENT_BLOCKLY_TOOLBOX_UPDATED = 'blockly-toolbox-updated', // Blockly toolbox has been updated
    EVENT_GAMEPAD_STATUS = 'gamepad-status', // Gamepad status on/off
    EVENT_ALERT = 'alert', // Alert dialog event
}

type Events = {
    [EventType.EVENT_FILESYS]: string;
    [EventType.EVENT_SHELL]: string;
    [EventType.EVENT_CONNECTION_STATUS]: string;
    [EventType.EVENT_THEME]: string;
    [EventType.EVENT_CONNECTION]: string;
    [EventType.EVENT_ID]: string;
    [EventType.EVENT_EDITOR]: EditorType;
    [EventType.EVENT_OPEN_FILE]: string;
    [EventType.EVENT_EDITOR_LOAD]: string;
    [EventType.EVENT_FONTCHANGE]: string;
    [EventType.EVENT_GENPYTHON]: string;
    [EventType.EVENT_GENPYTHON_DONE]: string;
    [EventType.EVENT_SAVE_EDITOR]: string;
    [EventType.EVENT_PROGRESS]: string;
    [EventType.EVENT_UPLOAD_DONE]: string;
    [EventType.EVENT_MICROPYTHON_UPDATE]: string;
    [EventType.EVENT_MICROPYTHON_UPDATE_DONE]: string;
    [EventType.EVENT_XRPLIB_UPDATE]: string;
    [EventType.EVENT_XRPLIB_UPDATE_DONE]: string;
    [EventType.EVENT_SHOWCHANGELOG]: string;
    [EventType.EVENT_DASHBOARD_DATA]: string;
    [EventType.EVENT_SHOWPROGRESS]: string;
    [EventType.EVENT_PROGRESS_ITEM]: string;
    [EventType.EVENT_FILESYS_STORAGE]: string;
    [EventType.EVENT_MUST_UPDATE_MICROPYTHON]: string;
    [EventType.EVENT_BLOCKLY_TOOLBOX_UPDATED]: string;
    [EventType.EVENT_GAMEPAD_STATUS]: string;
    [EventType.EVENT_ALERT]: string;
};

/**
 * AppMgr - manages several object instances within the App such as the following
 *          Connection
 *          Filesystem
 *          Editors
 */
export default class AppMgr {
    private _theme: string | undefined;
    private static _instance: AppMgr;
    private _emitter = mitt<Events>();
    private _connectionMgr: connecionMgr | null = null;
    private _folderData : FolderItem[] | null = null;
    private _authService: GoogleAuthService = new GoogleAuthService();
    private _driveService: GoogleDriveService = new GoogleDriveService();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    private AppMgr() {}

    public static getInstance(): AppMgr {
        if (!AppMgr._instance) {
            AppMgr._instance = new AppMgr();
        }
        return this._instance;
    }

    /**
     * driveService - return the Google Drive service instance
     * @return GoogleDriveService
     */
    public get authService(): GoogleAuthService {
        return this._authService;
    }

    /**
     * driveService - return the Google Drive service instance
     * @return GoogleDriveService
     */
    public get driveService(): GoogleDriveService {
        return this._driveService;
    }

    /**
     * Start and Initialize system objects
     */
    public start(): void {
        // onload theme selection
        this.onThemeChange(window.matchMedia('(prefers-color-scheme: dark)').matches ? Themes.DARK : Themes.LIGHT);
        // listen to system theme change event
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => this.onThemeChange(e.matches ? Themes.DARK : Themes.LIGHT));
        this._connectionMgr = new connecionMgr(this); 
    }

    /**
     * stop clean up connection and object etcs.
     */
    public stop(): void {
        this._connectionMgr?.getConnection()?.disconnect();
        this.off();
    }

    /**
     * onThemeChange event
     * @param theme
     */
    private onThemeChange(theme:string) {
        if (theme === Themes.DARK) {
            this._theme = Themes.DARK;
            this._emitter.emit(EventType.EVENT_THEME, this._theme);
        } else {
            this._theme = Themes.LIGHT;
            this._emitter.emit(EventType.EVENT_THEME, this._theme);
        }
    }

    /**
     * getTheme
     * @returns theme
     */
    public getTheme(): string {
        return this._theme || Themes.LIGHT;
    }

    /**
     * Subscribe to events
     * @param eventName
     * @param handler
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public on(eventName: EventType, handler: (...args: any[]) => void): void {
        this._emitter.on(eventName, handler);
    }

    /**
     * eventOff - turn off an event subscription
     * @param eventName 
     */
    public eventOff(eventName: EventType) {
        this._emitter.off(eventName);
    }

    /**
     * Emit events
     * @param eventName
     * @param eventData
     */
    public emit(eventName: EventType, eventData: string): void {
        this._emitter.emit(eventName, eventData);
    }

    /**
     * Remove all listeners for a given event
     */
    public off(): void {
        this._emitter.all.clear();
    }

    /**
     * getConnection - return the active connection
     */
    public getConnection(): Connection | null {
        if (!this._connectionMgr) {
            throw new Error('Connection manager is not initialized');
        }
        return this._connectionMgr.getConnection();
    }

    /**
     * getConnectionType - return the type of active connection, i.e., bluetooth or USB
     * @returns ConnectionType
     */
    public getConnectionType(): ConnectionType {
        const connection = this._connectionMgr?.getConnection() 
        return connection instanceof BluetoothConnection ? ConnectionType.BLUETOOTH : ConnectionType.USB;
    }

    /**
     * setFolderData - save a list of folder names for use with New File dialog
     * @param folderData 
     */
    public setFoderData(folderData: FolderItem[]) {
        this._folderData = folderData;
    }


    private filterFolders(folders: FolderItem[]): FolderItem[] | null {
        for (let i=0; i < folders.length; i++) {
            const children = folders[i].children;
            if (children !== null) {
                folders[i].children = children.filter(folder => (folder.children !== null)).map(folder => ({
                    name: folder.name,
                    id: folder.id,
                    isReadOnly: folder.isReadOnly,
                    path: folder.path,
                    children: folder.children        
                }))
                this.filterFolders(children);
            }
        }
        return folders;
    }

    /**
     * getFolderList - return a list of XRP folder except the 'lib' directory
     */
    public getFolderList() : FolderItem[] | null {
        if (!this._folderData) {
            return null;
        }

        if (this._folderData?.at(0)?.children?.length === 0  || this._folderData?.at(0)?.children === null) {
            return this._folderData;
        }

        // remove the lib directory first
        const folders = this._folderData?.at(0)?.children?.filter(folder => (folder.name !== 'lib' && folder.children !== null)).map(folder => ({ 
            name: folder.name,
            id: folder.id,
            isReadOnly: folder.isReadOnly,
            path: folder.path,
            children: folder.children
        })) ?? null;

        return folders ? this.filterFolders(folders) : null;
    }

    /**
     * getUserFolderList - return a list of user folders
     * @returns a list of user folders
     *          if no user folders, return null
     */
    public getUserFolderList(): FolderItem[] | null {
        if (!this._folderData) {
            return null;
        }

        // find the user folder
        const userFolders = this._folderData?.at(0)?.children?.filter(folder => (folder.name === 'users' && folder.children !== null)).map(folder => ({ 
            name: folder.name,
            id: folder.id,
            isReadOnly: folder.isReadOnly,
            path: folder.path,
            children: folder.children
        })) ?? null;

        let userlist: FolderItem[] | null = null;
        // if users folder's children not null, list all of the users folder's children
        if (userFolders && userFolders.length > 0 && userFolders[0].children) {
            // filter out folders that do not have children
            userlist = userFolders[0].children.filter(folder => (folder.children !== null)).map(folder => ({
                name: folder.name,
                id: folder.id,
                isReadOnly: folder.isReadOnly,
                path: folder.path,
                children: folder.children
            }));
        }

        return userlist;
    }
}
