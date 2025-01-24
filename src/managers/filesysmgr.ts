import AppMgr, { EventType } from "@/managers/appmgr";

/**
 * Tree Data in Json
 */
const treeData = {
    "root": {
        "container": {
            "item0": null,
            "item1": null,
            "item3": {
                "inner0": null,
                "inner1": null
            },
            "item4": null
        },
    }
}

/**
 * FilesysMgr - manages file stores in local storage as well as storing in XRP Robot
 */
export default class FilesysMgr {
    private appMgr: AppMgr = AppMgr.getInstance();
    /**
     * constructor
     */
    public FilesysMgr() {

    }

    /**
     * Start and Initialize filesystem objects
     */
    public start() {
        setTimeout(() => {
            this.appMgr.emit(EventType.EVENT_FILESYS, JSON.stringify(treeData));
        }, 10000);
    }
}