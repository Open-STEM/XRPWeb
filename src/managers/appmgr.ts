import FilesysMgr from '@/managers/filesysmgr';
import mitt from 'mitt';

export enum EventType {
    EVENT_FILESYS = 'filesys', // directoy tree from filesystem of the XRP
    EVENT_SHELL = 'shell', // shell updates from XRP
    EVENT_CONNECTION_STATUS = 'connection-status', // connection status updates
}

type Events = {
    [EventType.EVENT_FILESYS]: string;
    [EventType.EVENT_SHELL]: string;
    [EventType.EVENT_CONNECTION_STATUS]: string;
};

/**
 * AppMgr - manages several object instances within the App such as the following
 *          Connection
 *          Filesystem
 *          Editors
 */
export default class AppMgr {
    private static instance: AppMgr;
    private emitter = mitt<Events>();
    private filesysMgr: FilesysMgr | null = null;

    // @ts-expect-error Private constructor to prevent direct instantiation
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
        this.filesysMgr = new FilesysMgr();
        this.filesysMgr.start();
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
}
