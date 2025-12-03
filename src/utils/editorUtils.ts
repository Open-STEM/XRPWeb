import { IJsonTabNode, Layout } from "flexlayout-react";
import { EditorType, FileType, NewFileData } from "./types";
import AppMgr, { EventType } from "@/managers/appmgr";
import { Constants } from "./constants";
import EditorMgr from "@/managers/editormgr";

/**
 * CreateEditorTab - create the editor tabs in the editor tabset
 * @param data - file data
 * @param layoutref - reference to the layout
 */
export function CreateEditorTab(data: NewFileData, layoutref: React.RefObject<Layout>) {
    switch (data.filetype) {
        case FileType.BLOCKLY:
            {
                const tabInfo: IJsonTabNode = {
                    component: 'blockly',
                    name: data.name,
                    id: data.name,
                    helpText: data.path,
                };
                layoutref!.current?.addTabToTabSet(Constants.EDITOR_TABSET_ID, tabInfo);
                AppMgr.getInstance().emit(EventType.EVENT_EDITOR, EditorType.BLOCKLY);
                EditorMgr.getInstance().AddEditor({
                    id: data.name,
                    type: EditorType.BLOCKLY,
                    path: data.path,
                    gpath: data.gpath,
                    isSubscribed: false,
                    fontsize: Constants.DEFAULT_FONTSIZE,
                    content: data.content,
                    lastUpdated: new Date(),
                    isModified: false,
                });
            }
            break;
        case FileType.PYTHON:
        case FileType.OTHER:
            {
                const tabInfo: IJsonTabNode = {
                    component: 'editor',
                    name: data.name,
                    id: data.name,
                    helpText: data.path,
                };
                layoutref!.current?.addTabToTabSet(Constants.EDITOR_TABSET_ID, tabInfo);
                AppMgr.getInstance().emit(EventType.EVENT_EDITOR, EditorType.PYTHON);
                EditorMgr.getInstance().AddEditor({
                    id: data.name,
                    type: EditorType.PYTHON,
                    path: data.path,
                    gpath: data.gpath,
                    isSubscribed: false,
                    fontsize: Constants.DEFAULT_FONTSIZE,
                    content: data.content,
                    lastUpdated: new Date(),
                    isModified: false,
                });
            }
            break;
    }
}
