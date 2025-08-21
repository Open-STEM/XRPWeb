import { pythonGenerator } from 'blockly/python';
import { registerFieldColour } from '@blockly/field-colour';
import { BlocklyWorkspace, Workspace } from 'react-blockly';
import BlocklyConfigs from '@components/blockly/xrp_blockly_configs';
import * as Blockly from 'blockly/core';
import AppMgr, { EventType, Themes } from '@/managers/appmgr';
import { useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { StorageKeys } from '@/utils/localstorage';
import EditorMgr, { EditorSession } from '@/managers/editormgr';
import moment from 'moment';

registerFieldColour(); //Plugin needs to be registered. Used for the Color LED on the non beta board. 

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
    const [toolboxKey, setToolboxKey] = useState(0); // Force re-render when toolbox updates
    
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
                EditorMgr.getInstance().SaveToLocalStorage(
                    EditorMgr.getInstance().getEditorSession(name) as EditorSession,
                    blocklyCode
                );
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
                const loadContent = JSON.parse(content);
                if (loadContent.name !== name) return;

                const ws = Blockly.getMainWorkspace();
                if (ws) {
                    Blockly.serialization.workspaces.load(JSON.parse(loadContent.content), ws);
                    // @ts-expect-error - it is a valid function
                    ws.scrollCenter();
                    // @ts-expect-error - it is a valid function
                    ws.zoomToFit();
                }
                const session: EditorSession | undefined =
                    EditorMgr.getInstance().getEditorSession(loadContent.name);
                if (session) {
                    EditorMgr.getInstance().SaveToLocalStorage(session, loadContent.content);
                }
            });

            AppMgr.getInstance().on(EventType.EVENT_BLOCKLY_TOOLBOX_UPDATED, () => {
                // Force a re-render of the Blockly workspace to show new blocks
                const ws = Blockly.getMainWorkspace();
                if (ws) {
                    // Save current workspace content
                    const content = Blockly.serialization.workspaces.save(ws);
                    
                    // Force component re-render with new toolbox
                    setToolboxKey(prev => prev + 1);
                    
                    // Restore workspace content after re-render
                    setTimeout(() => {
                        const newWs = Blockly.getMainWorkspace();
                        if (newWs) {
                            Blockly.serialization.workspaces.load(content, newWs);
                            // @ts-expect-error - it is a valid function
                            newWs.scrollCenter();
                            // @ts-expect-error - it is a valid function
                            newWs.zoomToFit();
                        }
                    }, 100);
                }
            });

            AppMgr.getInstance().on(EventType.EVENT_GENPYTHON, (activeTab) => {
                if (name === activeTab) {
                    const session: EditorSession | undefined =
                    EditorMgr.getInstance().getEditorSession(activeTab);
                    if (session) {
                        const ws = Blockly.getMainWorkspace();
                        const code = pythonGenerator.workspaceToCode(ws);
                        if (ws && code) {
                            session.content = code;
                            AppMgr.getInstance().emit(EventType.EVENT_GENPYTHON_DONE, code);
                        }
                    }
                }
            });

            AppMgr.getInstance().on(EventType.EVENT_SAVE_EDITOR, () => {
                saveEditor();
            });

            EditorMgr.getInstance().setSubscription(name);
        } else {
            const editorSession = EditorMgr.getInstance().getEditorSession(name);
            if (editorSession && editorSession.content) {
                const ws = Blockly.getMainWorkspace();
                if (ws) {
                    Blockly.serialization.workspaces.load(
                        JSON.parse(editorSession.content),
                        ws
                    );
                    // @ts-expect-error - it is a valid function
                    ws.scrollCenter();
                }
            }
        }
    });

    return (
        <BlocklyWorkspace
            key={toolboxKey} // Force re-render when toolbox updates
            className="h-full" // you can use whatever classes are appropriate for your app's CSS
            toolboxConfiguration={BlocklyConfigs.ToolboxJson} // this must be a JSON toolbox definition
            workspaceConfiguration={{
                move:{
                    scrollbars: {horizontal: true, vertical: true},
                    drag: true,
                    wheel: true},
                zoom:{controls: true, wheel: false,
                    startScale: 1, maxScale: 1, minScale: 0.1, scaleSpeed: 1.2,
                pinch: false},

                trashcan: true,
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
