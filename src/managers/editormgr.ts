import { EditorType } from "@/utils/types";
import { CommandToXRPMgr } from "@/managers/commandstoxrpmgr";
import { Actions, Model } from "flexlayout-react";
import AppMgr, { EventType } from "@/managers/appmgr";
import { StorageKeys } from "@/utils/localstorage";
import { Constants } from "@/utils/constants";

/**
 * EditorSession - Editor session object
 */

export type EditorSession = {
    id: string;
    path: string;
    gpath?: string,
    type: EditorType;
    isSubscribed: boolean;
    fontsize: number;
    content?: string;
};

/**
 * EditorStore - editor session localstorage object
 * @typedef {Object} EditorStore
 * @property {string} id - editor session id
 * @property {string} path - editor session path
 * @property {string} content - editor content
 * @property {boolean} isBlockly - editor is blockly
 * @property {boolean} isSavedToXRP - editor content is saved to XRP
 */
export type EditorStore = {
    id: string;
    path: string;
    gpath?: string;
    isBlockly: boolean;
    isSavedToXRP: boolean;
    content: string;
};

/**
 * EditorMgr class - manages editor session for Blockly and Python
 */
export default class EditorMgr {
    private static instance: EditorMgr;
    private editorSessions = new Map<string, EditorSession>();
    private layoutModel?: Model;

    /**
     * Constructor
     */
    public EditorMgr() {}

    public static getInstance(): EditorMgr {
        if (!EditorMgr.instance) {
            EditorMgr.instance = new EditorMgr();
        }
        return this.instance;
    }

    /**
     * set the layout model for managing editor sesions
     * @param model 
     */
    public setLayoutModel(model: Model) {
        this.layoutModel = model;
    }

    /**
     * getLayoutModel - return the layout model
     * @returns 
     */
    public getLayoutModel(): Model | undefined{
        return this.layoutModel;
    }

    /**
     * AddEditor - Add a new editor session
     * @param session - Editor session object
     */
    public AddEditor(session: EditorSession ): void {
        console.log('AddEditor: ', session);
        if (!this.editorSessions.has(session.id)) {
            this.editorSessions.set(session.id, session);
        }
    }

    /**
     * RemoveEditor - Remove an editor session
     * @param session - Editor session object
     */
    public RemoveEditor(id: string ): string | undefined{
        console.log('RemoveEditor: ', id);
        if (this.editorSessions.has(id)) {
            const sesion = this.editorSessions.get(id);
            // clean up the event subscriptions
            const appMgr = AppMgr.getInstance();
            appMgr.eventOff(EventType.EVENT_THEME);
            appMgr.eventOff(EventType.EVENT_EDITOR_LOAD);
            if (sesion?.type === EditorType.BLOCKLY) {
                appMgr.eventOff(EventType.EVENT_GENPYTHON);
            } else if (sesion?.type === EditorType.PYTHON) {
                appMgr.eventOff(EventType.EVENT_FONTCHANGE);
            }
            appMgr.eventOff(EventType.EVENT_SAVE_EDITOR); 
            this.editorSessions.delete(id);
            this.RemoveFromLocalStorage(id);
        }
        if (this.editorSessions.size > 0) {
            const session = Array.from(this.editorSessions.values()).pop();
            if (session) {
                AppMgr.getInstance().emit(
                    EventType.EVENT_EDITOR,
                    session.type === EditorType.BLOCKLY ? EditorType.BLOCKLY : EditorType.PYTHON,
                );
                this.layoutModel?.doAction(Actions.selectTab(session.id));       
            }
            return session?.id;
        }
        return undefined;
    }

    /**
     * RemoveEditorTab - remove specified editor id from the Editor layout
     * @param id 
     */
    public RemoveEditorTab(id: string) {
        this.layoutModel?.doAction(Actions.deleteTab(id));
    }

    /**
     * RenameEditor
     * @param id 
     * @param newName 
     */
    public RenameEditor(id: string, newName: string) {
        const session = this.editorSessions.get(id);
        if (session) {
            session.id = newName;
            this.editorSessions.delete(id);
            this.editorSessions.set(newName, session);
            this.layoutModel?.doAction(Actions.renameTab(id, newName));
            this.layoutModel?.doAction(Actions.updateNodeAttributes(id, {helpText: session.path}))
        }
    }

    /**
     * getEditorSession - Get an editor session
     * @param id 
     * @returns EditorSession | undefined
     */
    public getEditorSession(id: string): EditorSession | undefined {
        return this.editorSessions.get(id);
    }

    /**
     * hasEditorSession - Check if an editor session exists
     * @param id - Editor session id
     * @returns true if the editor session exists
     */
    public hasEditorSession(id: string): boolean {
        return this.editorSessions.has(id);
    }

    /**
     * hasSubscription - check if subscription has been established
     * @param id 
     * @returns - true / false
     */
    public hasSubscription(id: string): boolean {
        return this.editorSessions.get(id)?.isSubscribed || false;
    }

    /**
     * setSubscription - set subscription state
     * @param id 
     */
    public setSubscription(id: string) {
        const session = this.editorSessions.get(id);
        if (session) {
            session.isSubscribed = true;
        }
    }

    /**
     * getFontsize - retrieve the fontsize of editor session
     * @param id 
     * @returns 
     */
    public getFontsize(id: string) {
        const session = this.editorSessions.get(id);
        if (session) {
            return session.fontsize;
        } else return Number(14);
    }

    /**
     * setFontsize - set the fontsize of the editor session
     * @param id 
     * @param fontsize 
     */
    public setFontsize(id: string, fontsize: number) {
        const session = this.editorSessions.get(id);
        if (session) {
            session.fontsize = fontsize;
        }
    }

    /**
     * saveEditor - save the editor code
     * @param id 
     * @param code 
     */
    public async saveEditor(id: string, code: string) {
        const session = this.editorSessions.get(id);
        if (session) {
            const isConnected = AppMgr.getInstance().getConnection()?.isConnected() ?? false;
            if (isConnected) {
                // save the session to XRP
                AppMgr.getInstance().emit(EventType.EVENT_SHOWPROGRESS, Constants.SHOW_PROGRESS);
                await CommandToXRPMgr.getInstance().uploadFile(session.path, code, true).then(() =>{
                    AppMgr.getInstance().emit(EventType.EVENT_UPLOAD_DONE, '');
                });
            }
            
            if (AppMgr.getInstance().authService.isLogin) {
                const mineType = session.type === EditorType.PYTHON ? 'text/x-python' : 'application/json';
                const blob = new Blob([code], { type: mineType});
                const filename = session.path.split('/').pop();

                AppMgr.getInstance().driveService.upsertFileToGoogleDrive(blob, filename ?? '', mineType, session.gpath);
            }
        }
    }

    /**
     * SaveToLocalStorage - save the editor session to local storage
     * @param session - editor session
     * @param code - editor content
     * @returns 
     */
    public SaveToLocalStorage(session: EditorSession, code: string) {
        // save the session to local storage
        const editorStore: EditorStore = {
            id: session.id,
            path: session.path,
            gpath: session.gpath,
            isBlockly: session.type === EditorType.BLOCKLY,
            isSavedToXRP: true,
            content: code,
        };
        let editorStoreJson = localStorage.getItem(StorageKeys.EDITORSTORE);
        let editorStores: EditorStore[];
        if (editorStoreJson) {
            editorStores = JSON.parse(editorStoreJson);
            const index = editorStores.findIndex((store: EditorStore) => store.id === session.id);
            if (index !== -1) {
                editorStores[index] = editorStore;
            } else {
                editorStores.push(editorStore);
            }
        } else {
            editorStores = [];
            editorStores.push(editorStore);
        }
        editorStoreJson = JSON.stringify(editorStores);
        localStorage.setItem(StorageKeys.EDITORSTORE, editorStoreJson);
    }

    /**
     * RemoveFromLocalStorage - remove the editor session from local storage
     * @param id - editor session id
     */
    public RemoveFromLocalStorage(id: string) {
        let editorStoreJson = localStorage.getItem(StorageKeys.EDITORSTORE);
        if (editorStoreJson) {
            const editorStores: EditorStore[] = JSON.parse(editorStoreJson);
            const index = editorStores.findIndex((store: EditorStore) => store.id === id);
            if (index !== -1) {
                editorStores.splice(index, 1);
                editorStoreJson = JSON.stringify(editorStores);
                localStorage.setItem(StorageKeys.EDITORSTORE, editorStoreJson);
            }
        }
    }
}
