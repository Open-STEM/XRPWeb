import { EditorType } from "@/utils/types";
import { CommandToXRPMgr } from "@/managers/commandstoxrpmgr";
import { Actions, Model } from "flexlayout-react";
import AppMgr, { EventType } from "@/managers/appmgr";

/**
 * EditorSession - Editor session object
 */

export type EditorSession = {
    id: string;
    path: string;
    type: EditorType;
    isSubscribed: boolean;
    fontsize: number;
    content?: string;
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
            this.editorSessions.delete(id);
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
            await CommandToXRPMgr.getInstance().uploadFile(session.path, code, true).then(() =>{
                AppMgr.getInstance().emit(EventType.EVENT_UPLOAD_DONE, '');
            });
        }
    }
}
