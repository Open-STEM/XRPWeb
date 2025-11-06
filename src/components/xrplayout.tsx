import { Layout, Model, IJsonModel, TabNode, Action, Actions, ITabRenderValues } from 'flexlayout-react';
import React, { useEffect } from 'react';
import BlocklyEditor from '@components/blockly';
import MonacoEditor from '@components/MonacoEditor';
import XRPShell from '@components/xrpshell';
import FolderIcon from '@assets/images/folder-24.png';
import ShellIcon from '@assets/images/shell.svg';
//import treeDaaJson from '@/utils/testdata';
import AppMgr, { EventType, Themes } from '@/managers/appmgr';
import FolderTree from './folder-tree';
import { Constants } from '@/utils/constants';
import { FileType, NewFileData } from '@/utils/types';
import { useLocalStorage } from 'usehooks-ts';
import { StorageKeys } from '@/utils/localstorage';
import EditorMgr, { EditorStore } from '@/managers/editormgr';
import { CreateEditorTab } from '@/utils/editorUtils';
import XRPDashboard from '@/components/dashboard/xrp-dashboard';
import AIChat from '@/components/chat/ai-chat';
import { useTranslation } from 'react-i18next';

/**
 *  Layout-React's layout JSON to specify the XRPWeb's single page application's layout
 */
const layout_json: IJsonModel = {
    global: {
        tabEnablePopout: false,
        tabSetEnableDeleteWhenEmpty: false,
        tabSetEnableDrag: false,
        tabSetEnableDrop: false,
        tabEnableRename: false
    },
    borders: [
        {
            type: 'border',
            location: 'left',
            enableDrop: false,
            enableAutoHide: true,
            size: 300,
            selected: 0,
            children: [
                {
                    type: 'tab',
                    id: Constants.FOLDER_TAB_ID,
                    name: 'folders',
                    component: 'folders',
                    enableClose: false,
                    icon: FolderIcon,
                },
            ],
        },
    ],
    layout: {
        type: 'row',
        id: 'mainRowId',
        weight: 100,
        children: [
            {
                type: 'row',
                id: 'combinedRowId',
                name: 'row-combined',
                weight: 80,
                children: [
                    {
                        type: 'tabset',
                        id: Constants.EDITOR_TABSET_ID,
                        name: 'editorTabset',
                        weight: 70,
                        children: [],
                    },
                    {
                        type: 'tabset',
                        id: Constants.SHELL_TABSET_ID,
                        name: 'shellTabset',
                        weight: 30,
                        children: [
                            {
                                type: 'tab',
                                id: Constants.SHELL_TAB_ID,
                                name: 'shell',
                                component: 'xterm',
                                enableClose: false,
                            },
                        ],
                    },
                ],
            },
        ],
    },
};

const model = Model.fromJson(layout_json);
EditorMgr.getInstance().setLayoutModel(model);
let layoutRef: React.RefObject<Layout> = {
    current: null,
};

const factory = (node: TabNode) => {
    const component = node.getComponent();
    if (component == 'editor') {
        return <MonacoEditor name={node.getName()} width="100vw" height="100vh" />;
    } else if (component == 'xterm') {
        return <XRPShell />;
    } else if (component == 'folders') {
        return <FolderTree treeData={null} theme="rct-dark" isHeader={true} />;
    } else if (component == 'blockly') {
        return <BlocklyEditor name={node.getName()} />;
    } else if (component == 'dashboard') {
        return <XRPDashboard />;
    } else if (component == 'aichat') {
        return <AIChat />;
    }
};

type XRPLayoutProps = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    forwardedref: any;
};

let hasSubscribed = false;

/**
 * useOnceCall - call the function once
 * @param cb 
 * @param condition 
 */
function useOnceCall(cb: () => void, condition = true) {
    const isCalledRef = React.useRef(false);
  
    React.useEffect(() => {
      if (condition && !isCalledRef.current) {
        isCalledRef.current = true;
        cb();
      }
    }, [cb, condition]);
}

/**
 *
 * @returns React XRPLayout component
 */
function XRPLayout({ forwardedref }: XRPLayoutProps) {
    const [activeTab, setActiveTab] = useLocalStorage(StorageKeys.ACTIVETAB, '');
    const { t } = useTranslation();

    /**
     * changeTheme - set the system selected theme
     * @param theme
     */
    const changeTheme = (theme: string) => {
        let themeName = '';
        if (theme === Themes.DARK) {
            themeName = 'dark.css';
        } else {
            themeName = 'light.css';
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const flexlayout_stylesheet: any = window.document.getElementById('flexlayout-stylesheet');
        const index = flexlayout_stylesheet.href.lastIndexOf('/');
        const newAddress = flexlayout_stylesheet.href.substr(0, index);
        const existingTheme = flexlayout_stylesheet.href.substr(index + 1);

        if (existingTheme === themeName) return;

        // eslint-disable-next-line prefer-const
        let stylesheetLink = document.createElement('link');
        stylesheetLink.setAttribute('id', 'flexlayout-stylesheet');
        stylesheetLink.setAttribute('rel', 'stylesheet');
        stylesheetLink.setAttribute('href', newAddress + '/' + themeName);

        const promises: Promise<boolean>[] = [];
        promises.push(
            new Promise((resolve) => {
                stylesheetLink.onload = () => resolve(true);
            }),
        );

        document.head.replaceChild(stylesheetLink, flexlayout_stylesheet);
    };

    useEffect(() => {
        layoutRef = forwardedref;

        if (layoutRef.current) {
            const themeName = AppMgr.getInstance().getTheme();
            changeTheme(themeName);
        }

        if (!hasSubscribed) {
            AppMgr.getInstance().on(EventType.EVENT_THEME, (theme) => {
                changeTheme(theme);
            });
            hasSubscribed = true;
        }
    }, [forwardedref]);

    /**
     * React Hook to handle the initial mount of the component and initialize the editor sessions
     */
    useOnceCall(() => {
        console.log('Initialize editors after the layout has been mounted');
        const handleWindowLoad = () => {
            // Check if there are any existing editor sessions in local storage
            // and create editor tabs for them
            const editors = localStorage.getItem(StorageKeys.EDITORSTORE);
            if (editors) {
                const editorStores: EditorStore[] = JSON.parse(editors);
                editorStores.forEach((store: EditorStore) => {
                    const fileData: NewFileData = {
                        parentId: '',
                        name: store.id,
                        path: store.path,
                        filetype: store.isBlockly ? FileType.BLOCKLY : FileType.PYTHON,
                        content: store.content,
                    }
                    CreateEditorTab(fileData, layoutRef);
                    setActiveTab(store.id);
                });
            }

            // check if the version is different and show the change log
            const version = localStorage.getItem(StorageKeys.VERSION);
            const currentVersion = Constants.APP_VERSION;
            if (version === null || version !== currentVersion) {
                AppMgr.getInstance().emit(EventType.EVENT_SHOWCHANGELOG, Constants.SHOW_CHANGELOG);
            } 
            localStorage.setItem(StorageKeys.VERSION, currentVersion || '');
        };

        window.addEventListener('load', handleWindowLoad);
        return () => {
            window.removeEventListener('load', handleWindowLoad);
        }
    });

    /**
     * handleActions - handle the actions from the layout
     * @param action
     * @returns
     */
    function handleActions(action: Action): Action | undefined {
        console.log('Handle Action: Action Type:', action.type, activeTab);
        switch (action.type) {
            case Actions.SELECT_TAB: {
                console.log('Selected Tab:', action.data.tabNode);
                if (EditorMgr.getInstance().hasEditorSession(action.data.tabNode)) {
                    const editorType = EditorMgr.getInstance().getEditorSession(action.data.tabNode)?.type;
                    if (editorType !== undefined) {
                        AppMgr.getInstance().emit(EventType.EVENT_EDITOR, editorType);
                    }
                } 
                setActiveTab(action.data.tabNode);
            }
            break;
            case Actions.DELETE_TAB: {        
                console.log('Delete Node:', action.data);
                const id = EditorMgr.getInstance().RemoveEditor(action.data.node);
                if (id) {
                    setActiveTab(id);
                }
            }
            break;
            default: {
                console.log('Default Action:', action);
            }
            break;
        }
        return action;
    }

    /**
     * onRenderTab - render the tab with custom functionality
     * @param node 
     * @param renderValues
     * @returns 
     */
    const onRenderTab = (node: TabNode, renderValues: ITabRenderValues) => {
        // Override the content to use the translated tab names
        if (node.getId() === Constants.FOLDER_TAB_ID) {
            renderValues.leading = <img src={FolderIcon} alt="icon" style={{ width: '16px', height: '16px', marginRight: '16px' }} />;
        } else if (node.getId() === Constants.SHELL_TAB_ID) {
            renderValues.leading = <img src={ShellIcon} alt="icon" style={{ width: '16px', height: '16px', marginRight: '0px' }} />;
        }
        renderValues.content = t(node.getName());
        return renderValues;
    };

    return <Layout ref={forwardedref} model={model} factory={factory} onAction={handleActions} onRenderTab={onRenderTab}/>;
}

export default XRPLayout;
