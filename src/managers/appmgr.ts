
/**
 * AppMgr - manages several object instances within the App such as the following
 *          Connection
 *          Filesystem
 *          Editors
 */
export default class AppMgr {
    private static instance: AppMgr;

    // Private constructor to prevent direct instantiation
    private AppMgr() {}

    public static getInstance() : AppMgr {
        if (!AppMgr.instance) {
            AppMgr.instance = new AppMgr();
        }
        return this.instance;
    }

    /**
     * Start and Initialize system objects
     */
    public start(): void {

    }
}