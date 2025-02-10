import FilesysMgr from '@/managers/filesysmgr';
import connecionMgr from '@/managers/connectionmgr';
import mitt from 'mitt';
import Connection from '@/connections/connection';
import { ConnectionType, EditorType, FolderItem } from '@/utils/types';
import { BluetoothConnection } from '@/connections/bluetoothconnection';

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
};

/**
 * AppMgr - manages several object instances within the App such as the following
 *          Connection
 *          Filesystem
 *          Editors
 */
export default class AppMgr {
    private theme: string | undefined;
    private static instance: AppMgr;
    private emitter = mitt<Events>();
    private filesysMgr: FilesysMgr | null = null;
    private connectionMgr: connecionMgr | null = null;
    private folderData : FolderItem[] | null = null;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    private AppMgr() {}

    public static getInstance(): AppMgr {
        if (!AppMgr.instance) {
            AppMgr.instance = new AppMgr();
        }
        return this.instance;
    }

    /**
     * Start and Initialize system objects
     */
    public start(): void {
        // onload theme selection
        this.onThemeChange(window.matchMedia('(prefers-color-scheme: dark)').matches ? Themes.DARK : Themes.LIGHT);
        // listen to system theme change event
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => this.onThemeChange(e.matches ? Themes.DARK : Themes.LIGHT));
        this.filesysMgr = new FilesysMgr();
        this.filesysMgr.start();
        this.connectionMgr = new connecionMgr(this); 
    }

    /**
     * stop clean up connection and object etcs.
     */
    public stop(): void {
        this.connectionMgr?.getConnection()?.disconnect();
        this.off();
    }

    /**
     * onThemeChange event
     * @param theme
     */
    private onThemeChange(theme:string) {
        if (theme === Themes.DARK) {
            this.theme = Themes.DARK;
            this.emitter.emit(EventType.EVENT_THEME, this.theme);
        } else {
            this.theme = Themes.LIGHT;
            this.emitter.emit(EventType.EVENT_THEME, this.theme);
        }
    }

    /**
     * getTheme
     * @returns theme
     */
    public getTheme(): string {
        return this.theme || Themes.LIGHT;
    }

    /**
     * Subscribe to events
     * @param eventName
     * @param handler
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public on(eventName: EventType, handler: (...args: any[]) => void): void {
        this.emitter.on(eventName, handler);
    }

    /**
     * eventOff - turn off an event subscription
     * @param eventName 
     */
    public eventOff(eventName: EventType) {
        this.emitter.off(eventName);
    }

    /**
     * Emit events
     * @param eventName
     * @param eventData
     */
    public emit(eventName: EventType, eventData: string): void {
        this.emitter.emit(eventName, eventData);
    }

    /**
     * Remove all listeners for a given event
     */
    public off(): void {
        this.emitter.all.clear();
    }

    /**
     * getConnection - return the active connection
     */
    public getConnection(): Connection | null {
        if (!this.connectionMgr) {
            throw new Error('Connection manager is not initialized');
        }
        return this.connectionMgr.getConnection();
    }

    /**
     * getConnectionType - return the type of active connection, i.e., bluetooth or USB
     * @returns ConnectionType
     */
    public getConnectionType(): ConnectionType {
        const connection = this.connectionMgr?.getConnection() 
        return connection instanceof BluetoothConnection ? ConnectionType.BLUETOOTH : ConnectionType.USB;
    }

    /**
     * setFolderData - save a list of folder names for use with New File dialog
     * @param folderData 
     */
    public setFoderData(folderData: FolderItem[]) {
        this.folderData = folderData;
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
        if (!this.folderData) {
            return null;
        }

        // remove the lib directory first
        const folders = this.folderData?.at(0)?.children?.filter(folder => (folder.name !== 'lib' && folder.children !== null)).map(folder => ({ 
            name: folder.name,
            id: folder.id,
            isReadOnly: folder.isReadOnly,
            path: folder.path,
            children: folder.children
        })) ?? null;

        return folders ? this.filterFolders(folders) : null;
    }
}
