import AppMgr, { EventType } from '@/managers/appmgr';
import treeData from '@/utils/testdata';

/**
 * FilesysMgr - manages file stores in local storage as well as storing in XRP Robot
 */
export default class FilesysMgr {
    private appMgr: AppMgr = AppMgr.getInstance();
    /**
     * constructor
     */
    public FilesysMgr() {}

    /**
     * Start and Initialize filesystem objects
     */
    public start() {
        setTimeout(() => {
            this.appMgr.emit(EventType.EVENT_FILESYS, JSON.stringify(treeData));
        }, 10000);
    }
}
