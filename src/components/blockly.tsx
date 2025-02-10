import { pythonGenerator } from 'blockly/python';
import { BlocklyWorkspace, Workspace } from 'react-blockly';
import BlocklyConfigs from '@components/blockly/xrp_blockly_configs';
import * as Blockly from 'blockly/core';
import AppMgr, { EventType, Themes } from '@/managers/appmgr';
import { useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { StorageKeys } from '@/utils/localstorage';
import EditorMgr, { EditorSession } from '@/managers/editormgr';
import moment from 'moment';

const blocklyDarkTheme = Blockly.Theme.defineTheme('dark', {
    base: Blockly.Themes.Classic,
    componentStyles: {
        workspaceBackgroundColour: '#1e1e1e',
        toolboxBackgroundColour: '#444',
        toolboxForegroundColour: '#ddd',
        flyoutBackgroundColour: '#444',
        flyoutForegroundColour: '#ddd',
        flyoutOpacity: 1,
        scrollbarColour: '#797979',
        insertionMarkerColour: '#fff',
        insertionMarkerOpacity: 0.3,
        scrollbarOpacity: 0.4,
        cursorColour: '#d0d0d0',
    },
    name: 'dark',
});

const blocklyMpdernTheme = Blockly.Theme.defineTheme('modern', {
    base: Blockly.Themes.Classic,
    blockStyles: {
        colour_blocks: {
            colourPrimary: '#a5745b',
            colourSecondary: '#dbc7bd',
            colourTertiary: '#845d49',
        },
        list_blocks: {
            colourPrimary: '#745ba5',
            colourSecondary: '#c7bddb',
            colourTertiary: '#5d4984',
        },
        logic_blocks: {
            colourPrimary: '#5b80a5',
            colourSecondary: '#bdccdb',
            colourTertiary: '#496684',
        },
        loop_blocks: {
            colourPrimary: '#5ba55b',
            colourSecondary: '#bddbbd',
            colourTertiary: '#498449',
        },
        math_blocks: {
            colourPrimary: '#5b67a5',
            colourSecondary: '#bdc2db',
            colourTertiary: '#495284',
        },
        procedure_blocks: {
            colourPrimary: '#995ba5',
            colourSecondary: '#d6bddb',
            colourTertiary: '#7a4984',
        },
        text_blocks: {
            colourPrimary: '#5ba58c',
            colourSecondary: '#bddbd1',
            colourTertiary: '#498470',
        },
        variable_blocks: {
            colourPrimary: '#a55b99',
            colourSecondary: '#dbbdd6',
            colourTertiary: '#84497a',
        },
        variable_dynamic_blocks: {
            colourPrimary: '#a55b99',
            colourSecondary: '#dbbdd6',
            colourTertiary: '#84497a',
        },
        hat_blocks: {
            colourPrimary: '#a55b99',
            colourSecondary: '#dbbdd6',
            colourTertiary: '#84497a',
            hat: 'cap',
        },
    },
    categoryStyles: {
        colour_category: {
            colour: '#a5745b',
        },
        list_category: {
            colour: '#745ba5',
        },
        logic_category: {
            colour: '#5b80a5',
        },
        loop_category: {
            colour: '#5ba55b',
        },
        math_category: {
            colour: '#5b67a5',
        },
        procedure_category: {
            colour: '#995ba5',
        },
        text_category: {
            colour: '#5ba58c',
        },
        variable_category: {
            colour: '#a55b99',
        },
        variable_dynamic_category: {
            colour: '#a55b99',
        },
    },
    componentStyles: {},
    fontStyle: {},
    name: 'modern',
});

interface BlocklyEditorProps {
    name: string;
}

/**
 * BlocklyEditor component
 * @returns
 */
function BlocklyEditor({ name }: BlocklyEditorProps) {
    /**
     * saveEditor
     */
    function saveEditor() {
        const ws = Blockly.getMainWorkspace();
        if (ws) {
            const activeTab = localStorage.getItem(StorageKeys.ACTIVETAB)?.replace(/^"|"$/g, '');
            if (activeTab === name) {
                const pythonCode = pythonGenerator
                    .workspaceToCode(ws)
                    .replace('from numbers import Number\n', 'Number = int\n');
                const blocklyCode = JSON.stringify(Blockly.serialization.workspaces.save(ws));
                const date = moment();
                const formatedDate = date.format('YYYY-MM-DD HH:MM:SS');
                const code =
                    pythonCode + '\n\n\n## ' + formatedDate + '\n##XRPBLOCKS ' + blocklyCode;
                console.log('Saving blockly', activeTab, code);
                EditorMgr.getInstance().saveEditor(name, code);
            }
        }
    }

    useHotkeys('ctrl+s, meta+s', (event) => {
        event.preventDefault();
        saveEditor();
    });

    function onWorkspaceDidChange(ws: Workspace | undefined) {
        const code = pythonGenerator.workspaceToCode(ws);
        console.log(code);
    }

    useEffect(() => {
        if (
            EditorMgr.getInstance().hasEditorSession(name) &&
            !EditorMgr.getInstance().hasSubscription(name)
        ) {
            AppMgr.getInstance().on(EventType.EVENT_THEME, (theme) => {
                const ws = Blockly.getMainWorkspace();

                if (ws) {
                    // Not sure why the compiler complain but it works at runtime
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    ws.setTheme(theme === Themes.DARK ? blocklyDarkTheme : blocklyMpdernTheme);
                }
            });

            AppMgr.getInstance().on(EventType.EVENT_EDITOR_LOAD, (content) => {
                const activeTab = localStorage
                    .getItem(StorageKeys.ACTIVETAB)
                    ?.replace(/^"|"$/g, '');
                if (activeTab !== name) return;

                const ws = Blockly.getMainWorkspace();
                if (ws) {
                    Blockly.serialization.workspaces.load(JSON.parse(content), ws);
                }
            });

            AppMgr.getInstance().on(EventType.EVENT_GENPYTHON, (activeTab) => {
                if (name === activeTab) {
                    const ws = Blockly.getMainWorkspace();
                    const code = pythonGenerator.workspaceToCode(ws);

                    if (ws && code) {
                        const session: EditorSession | undefined =
                            EditorMgr.getInstance().getEditorSession(activeTab);
                        if (session) {
                            session.content = code;
                        }
                        AppMgr.getInstance().emit(EventType.EVENT_GENPYTHON_DONE, code);
                    }
                }
            });

            AppMgr.getInstance().on(EventType.EVENT_SAVE_EDITOR, () => {
                saveEditor();
            });

            EditorMgr.getInstance().setSubscription(name);
        }
    });

    return (
        <BlocklyWorkspace
            className="h-full" // you can use whatever classes are appropriate for your app's CSS
            toolboxConfiguration={BlocklyConfigs.ToolboxJson} // this must be a JSON toolbox definition
            workspaceConfiguration={{
                grid: {
                    spacing: 20,
                    length: 3,
                    colour: '#ccc',
                    snap: true,
                },
                theme:
                    AppMgr.getInstance().getTheme() === Themes.DARK
                        ? blocklyDarkTheme
                        : blocklyMpdernTheme,
            }}
            initialJson={BlocklyConfigs.InitialJson}
            onWorkspaceChange={onWorkspaceDidChange}
        />
    );
}

export default BlocklyEditor;
