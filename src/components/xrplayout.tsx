import { Layout, Model, IJsonModel, TabNode, Action, Actions } from 'flexlayout-react';
import React, { useEffect } from 'react';
import BlocklyEditor from '@components/blockly';
import MonacoEditor from '@components/MonacoEditor';
import XRPShell from '@components/xrpshell';
import FolderIcon from '@assets/images/folder-24.png';
import i18n from '@/utils/i18n';
//import treeDaaJson from '@/utils/testdata';
import AppMgr, { EventType, Themes } from '@/managers/appmgr';
import FolderTree from './folder-tree';
import { Constants } from '@/utils/constants';
import { EditorType } from '@/utils/types';
import { useLocalStorage } from 'usehooks-ts';
import { StorageKeys } from '@/utils/localstorage';
import EditorMgr from '@/managers/editormgr';

/**
 *  Layout-React's layout JSON to specify the XRPWeb's single page application's layout
 */
const layout_json: IJsonModel = {
    global: {
        tabEnablePopout: false,
        tabSetEnableDeleteWhenEmpty: false,
        tabSetEnableDrag: false,
        tabSetEnableDrop: false,
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
                    name: i18n.t('folders'),
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
                                id: 'shellId',
                                name: i18n.t('shell'),
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
    }
};

type XRPLayoutProps = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    forwardedref: any;
};

let hasSubscribed = false;

/**
 *
 * @returns React XRPLayout component
 */
function XRPLayout({ forwardedref }: XRPLayoutProps) {
    const [activeTab, setActiveTab] = useLocalStorage(StorageKeys.ACTIVETAB, '');

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
     * handleActions - handle the actions from the layout
     * @param action
     * @returns
     */
    function handleActions(action: Action): Action | undefined {
        console.log('Action:', activeTab);
        if (action.type === Actions.SELECT_TAB) {
            console.log('Selected Tab:', action.data.tabNode);
            const blockly = action.data.tabNode.includes('.blocks');
            if (EditorMgr.getInstance().hasEditorSession(action.data.tabNode)) {
                AppMgr.getInstance().emit(
                    EventType.EVENT_EDITOR,
                    blockly ? EditorType.BLOCKLY : EditorType.PYTHON,
                );
                setActiveTab(action.data.tabNode);
            }
        }
        if (action.type === Actions.DELETE_TAB) {
            console.log('Moved Node:', action.data);
            const id = EditorMgr.getInstance().RemoveEditor(action.data.node);
            if (id) 
                setActiveTab(id);
        }
        return action;
    }

    return <Layout ref={forwardedref} model={model} factory={factory} onAction={handleActions} />;
}

export default XRPLayout;
