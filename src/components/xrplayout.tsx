import { Layout, Model, IJsonModel, TabNode } from 'flexlayout-react';
import React, { useEffect } from 'react';
import Folder from './folder';
import BlocklyEditor from '@components/blockly';
import EditorChooser from '@components/editor_chooser';
import MonacoEditor from '@components/MonacoEditor';
import XRPShell from '@components/xrpshell';
import FolderIcon from '@assets/images/folder-24.png';
import i18n from '@/utils/i18n';
import treeDaaJson from '@/utils/testdata';
import AppMgr, { EventType, Themes } from '@/managers/appmgr';

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
            size: 250,
            children: [
                {
                    type: 'tab',
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
                        id: 'editorTabSetId',
                        name: 'editorTabset',
                        weight: 70,
                        children: [
                            {
                                id: 'chooserId',
                                type: 'tab',
                                name: i18n.t('chooseMode'),
                                component: 'editor-chooser',
                                enableClose: true,
                            },
                        ],
                    },
                    {
                        type: 'tabset',
                        id: 'shellTabsetId',
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
let layoutRef: React.RefObject<Layout> = {
    current: null,
};

const factory = (node: TabNode) => {
    const component = node.getComponent();
    if (component == 'editor') {
        return <MonacoEditor width="100vw" height="100vh" />;
    } else if (component == 'xterm') {
        return <XRPShell />;
    } else if (component == 'folders') {
        return <Folder treeData={treeDaaJson} theme="rct-dark" />;
    } else if (component == 'blockly') {
        return <BlocklyEditor />;
    } else if (component == 'editor-chooser') {
        return <EditorChooser flref={layoutRef} />;
    }
};

type XRPLayoutProps = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    forwardedref: any;
};

/**
 *
 * @returns React XRPLayout component
 */
function XRPLayout({ forwardedref }: XRPLayoutProps) {
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
        const existingTheme = flexlayout_stylesheet.href.substr(index+1);
        
        if (existingTheme === themeName)
            return;

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
        AppMgr.getInstance().on(EventType.EVENT_THEME, (theme) => {
            changeTheme(theme);
        });
    }, [forwardedref]);

    return <Layout ref={forwardedref} model={model} factory={factory} />;
}

export default XRPLayout;
