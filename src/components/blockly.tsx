import { pythonGenerator } from 'blockly/python';
import { registerFieldColour } from '@blockly/field-colour';
import { BlocklyWorkspace, Workspace } from 'react-blockly';
import BlocklyConfigs from '@components/blockly/xrp_blockly_configs';
import * as Blockly from 'blockly/core';
import { setBlocklyLocale } from '@/utils/blockly-locales';
import AppMgr, { EventType, Themes } from '@/managers/appmgr';
import { useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { StorageKeys } from '@/utils/localstorage';
import EditorMgr, { EditorSession } from '@/managers/editormgr';
import moment from 'moment';
import { EditorType } from '@/utils/types';

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
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isListenerSet, setIsListenerSet] = useState(false);

    /**
     * handleOnInject
     */
    function handleOnInject(ws: Workspace) {
        // save the ws for this editor session
        const editorSession = EditorMgr.getInstance().getEditorSession(name);
        if (editorSession) {
            editorSession.workspace = ws;
        }
    }

    /**
     * blocklyToPython
     * @param ws
     * @returns
     */
    function blocklyToPython(ws: Workspace) {
        const pythonCode = pythonGenerator
            .workspaceToCode(ws)
            .replace('from numbers import Number\n', 'Number = int\n');
        const blocklyCode = JSON.stringify(Blockly.serialization.workspaces.save(ws));
        const date = moment();
        const formatedDate = date.format('YYYY-MM-DD HH:MM:SS');
        const code = pythonCode + '\n\n\n## ' + formatedDate + '\n##XRPBLOCKS ' + blocklyCode;
        return code;
    }
    
    /**
     * saveEditor
     */
    async function saveEditor() {
        const ws = EditorMgr.getInstance().getEditorSession(name)?.workspace;
        if (ws) {
            const activeTab = localStorage.getItem(StorageKeys.ACTIVETAB)?.replace(/^"|"$/g, '');
            if (activeTab === name) {
                const code = blocklyToPython(ws);
                console.log('Saving blockly', activeTab, code);
                await EditorMgr.getInstance().saveEditor(name, code);
                EditorMgr.getInstance().SaveToLocalStorage(
                    EditorMgr.getInstance().getEditorSession(name) as EditorSession,
                    code
                );
            }
        }
    }

    useHotkeys('ctrl+s, meta+s', (event) => {
        event.preventDefault();
        saveEditor();
    });

    useEffect(() => {
        if (
            EditorMgr.getInstance().hasEditorSession(name) &&
            !EditorMgr.getInstance().hasSubscription(name)
        ) {
            AppMgr.getInstance().on(EventType.EVENT_THEME, (theme) => {
                const ws = EditorMgr.getInstance().getEditorSession(name)?.workspace;

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

                const ws = EditorMgr.getInstance().getEditorSession(name)?.workspace;
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

            AppMgr.getInstance().on(EventType.EVENT_EDITOR, (type) => {
                if (type === EditorType.BLOCKLY) {
                    const ws = EditorMgr.getInstance().getEditorSession(name)?.workspace;
                    if (ws) {
                        console.log('rescrolling to center!')
                        // @ts-expect-error - it is a valid function
                        ws.scrollCenter();
                        setTimeout(() => {
                            // @ts-expect-error - it is a valid function
                            ws.scrollCenter();
                        }, 200)
                    }                                     
                }
            });

            AppMgr.getInstance().on(EventType.EVENT_BLOCKLY_TOOLBOX_UPDATED, () => {
                // Force a re-render of the Blockly workspace to show new blocks
                const ws = EditorMgr.getInstance().getEditorSession(name)?.workspace;
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
                        const ws = session?.workspace;
                        const code = pythonGenerator.workspaceToCode(ws);
                        if (ws && code) {
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
                // There appears to be some timing issues in loading the content into the workspace
                // Set 100 ms delay to accommendate the timing issue
                const loadEditor = (name: string, content: string) => {
                    const lines: string[] | undefined = content.split('##XRPBLOCKS ');
                    const blockContent = lines.length > 1 ? lines[1] : lines[0];
                    const loadContent = { name: name, content: blockContent };
                    AppMgr.getInstance().emit(EventType.EVENT_EDITOR_LOAD, JSON.stringify(loadContent));                    
                };
                setTimeout(loadEditor, 100, name, editorSession.content);
            }
        }

 // Set up language based on stored preference
        const setupLanguage = () => {
            const storedLanguage = localStorage.getItem(StorageKeys.LANGUAGE) || 'en';
            setBlocklyLocale(storedLanguage);
        };
        
        // Call setupLanguage to initialize Blockly locale
        setupLanguage();
        // Set up workspace change listener for live content tracking
        const setupWorkspaceListener = () => {
            const ws = Blockly.getMainWorkspace();
            if (ws) {
                // Listen for workspace changes
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const changeListener = (event: any) => {
                    if (event.type === Blockly.Events.FINISHED_LOADING) {
                        setIsLoading(false);
                        return;
                    }
                    if (isLoading && 
                        event.type === Blockly.Events.BLOCK_CREATE ||
                        event.type === Blockly.Events.BLOCK_DELETE ||
                        event.type === Blockly.Events.BLOCK_CHANGE
                    ) { return; }
                    if (event.type === Blockly.Events.VIEWPORT_CHANGE || event.isUiEvent) { return; }
                    try {
                        console.log('Workspace changed, saving session:', name);
                        EditorMgr.getInstance().updateEditorSessionChange(name, true);
                        const code = blocklyToPython(ws);
                        EditorMgr.getInstance().SaveToLocalStorage(EditorMgr.getInstance().getEditorSession(name) as EditorSession, code);
                    } catch (e) {
                        console.warn('Failed to serialize Blockly workspace:', e);
                    }
                };
                
                ws.addChangeListener(changeListener);
                
                // Store the listener for cleanup
                return changeListener;
            }
            return null;
        };

        let listener = null;
        if (!isListenerSet) {
            listener = setupWorkspaceListener();
            setIsListenerSet(true);
        }

        return () => {
            // Cleanup listener on unmount
            const ws = Blockly.getMainWorkspace();
            if (ws && isListenerSet) {
                // @ts-expect-error - listener may be null
                ws.removeChangeListener(listener);
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
            onInject={handleOnInject}
        />
    );
}

export default BlocklyEditor;
