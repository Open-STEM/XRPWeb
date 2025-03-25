import '@codingame/monaco-vscode-python-default-extension';
import '@codingame/monaco-vscode-theme-defaults-default-extension';
import { useEffect, useMemo, useRef } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { initialize } from 'vscode/services';
import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override';
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';
import getTextMateServiceOverride from '@codingame/monaco-vscode-textmate-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getConfigurationServiceOverride, {
    updateUserConfiguration,
} from '@codingame/monaco-vscode-configuration-service-override';
import { ExtensionHostKind, registerExtension } from 'vscode/extensions';
// we need to import this so monaco-languageclient can use vscode-api
import 'vscode/localExtensionHost';
import { initializedAndStartLanguageClient } from '@components/lsp-client';
import AppMgr, { EventType, Themes } from '@/managers/appmgr';
import i18n from '@/utils/i18n';
import { StorageKeys } from '@/utils/localstorage';
import EditorMgr from '@/managers/editormgr';
import { FontSize } from '@/utils/types';
import { Constants } from '@/utils/constants';

const languageId = 'python';
let isClientInitalized: boolean = false;

export type WorkerLoader = () => Worker;
const workerLoaders: Partial<Record<string, WorkerLoader>> = {
    TextEditorWorker: () =>
        new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), {
            type: 'module',
        }),
    TextMateWorker: () =>
        new Worker(
            new URL('@codingame/monaco-vscode-textmate-service-override/worker', import.meta.url),
            { type: 'module' },
        ),
};

window.MonacoEnvironment = {
    getWorker: function (_moduleId, label) {
        console.log('getWorker', _moduleId, label);
        const workerFactory = workerLoaders[label];
        if (workerFactory != null) {
            return workerFactory();
        }
        throw new Error(`Worker ${label} not found`);
    },
};

await initialize({
    ...getThemeServiceOverride(),
    ...getTextMateServiceOverride(),
    ...getConfigurationServiceOverride(),
    ...getKeybindingsServiceOverride(),
    ...getLanguagesServiceOverride(),
});

// extension configuration derived from:
// https://github.com/microsoft/pyright/blob/main/packages/vscode-pyright/package.json
// only a minimum is required to get pyright working
const extension = {
    name: 'python-client',
    publisher: 'monaco-languageclient-project',
    version: '1.0.0',
    engines: {
        vscode: '^1.78.0',
    },
    contributes: {
        languages: [
            {
                id: languageId,
                aliases: ['Python'],
                extensions: ['.py', '.pyi'],
            },
        ],
        commands: [
            {
                command: 'pyright.restartserver',
                title: 'Pyright: Restart Server',
                category: 'Pyright',
            },
            {
                command: 'pyright.organizeimports',
                title: 'Pyright: Organize Imports',
                category: 'Pyright',
            },
        ],
        keybindings: [
            {
                key: 'ctrl+k',
                command: 'pyright.organizeimports',
                when: 'editorTextFocus',
            },
        ],
    },
};

registerExtension(extension, ExtensionHostKind.LocalProcess);

type MonacoEditorProps = {
    /**
     * name of the editor container
     */
    name: string;
    /**
     * Height of the editor container
     */
    width: number | string;
    /**
     * Width of the editor container
     */
    height: number | string;
    /**
     * Class name of the editor container
     */
    className?: string;
    /**
     * Language of the current model
     */
    language?: string;
    /**
     * Path of the file
     */
    // path?: string,
    /**
     * Value of the current model
     */
    value?: string;
};

const MonacoEditor = ({
    name,
    width = '100vw',
    height = '100vh',
    language = 'python',
    value,
    className,
}: MonacoEditorProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const editor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    const fixedWidth = width;
    const fixedHeight = height;
    const style = useMemo(
        () => ({
            width: fixedWidth,
            height: fixedHeight,
        }),
        [fixedWidth, fixedHeight],
    );

    useEffect(() => {
        /**
         * SaveEditor save the current editor session to XRP
         * @param code
         */
        function SaveEditor(code: string) {
            const activeTab = localStorage.getItem(StorageKeys.ACTIVETAB)?.replace(/^"|"$/g, '');
            if (activeTab === name) {
                EditorMgr.getInstance().saveEditor(name, code);
            }
        }

        if (
            EditorMgr.getInstance().hasEditorSession(name) &&
            !EditorMgr.getInstance().hasSubscription(name)
        ) {
            AppMgr.getInstance().on(EventType.EVENT_THEME, (theme) => {
                console.log('Monaco set theme to ${selectedTheme}');
                if (editor.current != null)
                    monaco.editor.setTheme(theme === Themes.DARK ? 'Default Dark Modern' : 'vs');
            });

            AppMgr.getInstance().on(EventType.EVENT_EDITOR_LOAD, (content) => {
                console.log('Editor Content', content);
                const activeTab = localStorage
                    .getItem(StorageKeys.ACTIVETAB)
                    ?.replace(/^"|"$/g, '');
                if (activeTab !== name) return;
                if (containerRef.current && editor.current) {
                    const model = monaco.editor.createModel(content, languageId);
                    editor.current.setModel(model);
                }
            });

            AppMgr.getInstance().on(EventType.EVENT_FONTCHANGE, (change) => {
                const activeTab = localStorage
                    .getItem(StorageKeys.ACTIVETAB)
                    ?.replace(/^"|"$/g, '');
                if (activeTab !== name) return;
                if (change === FontSize.INCREASE) {
                    const fontsize = EditorMgr.getInstance().getFontsize(name) + 1;
                    EditorMgr.getInstance().setFontsize(name, fontsize);
                    editor.current?.updateOptions({ fontSize: fontsize });
                } else if (change === FontSize.DESCREASE) {
                    const fontsize = EditorMgr.getInstance().getFontsize(name) - 1;
                    EditorMgr.getInstance().setFontsize(name, fontsize);
                    editor.current?.updateOptions({ fontSize: fontsize });
                }
            });

            AppMgr.getInstance().on(EventType.EVENT_SAVE_EDITOR, () => {
                const code = editor.current?.getValue();
                if (code !== undefined) {
                    SaveEditor(code);
                }
            });

            EditorMgr.getInstance().setFontsize(name, Constants.DEFAULT_FONTSIZE);
            EditorMgr.getInstance().setSubscription(name);
        }

        if (containerRef.current) {
            if (editor.current === null) {
                updateUserConfiguration(`{
                    "editor.fontSize": ${Constants.DEFAULT_FONTSIZE},
                    "workbench.colorTheme": "${AppMgr.getInstance().getTheme() === Themes.DARK ? 'Default Dark Modern' : 'vs'}"
                }`);

                editor.current = monaco.editor.create(containerRef.current, {
                    value: value,
                    language: language,
                });

                monaco.editor.onDidCreateEditor((codeEditor) => {
                    console.log('Editor created', codeEditor.getId());
                });

                editor.current.addAction({
                    id: 'save',
                    label: i18n.t('save'),
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
                    contextMenuGroupId: 'navigation',
                    contextMenuOrder: 1.5,
                    precondition: '',
                    keybindingContext: '',
                    run: (ed) => {
                        console.log('Save', ed);
                        const code = editor.current?.getValue();
                        if (code !== undefined) {
                            SaveEditor(code);
                        }
                    },
                });

                if (!isClientInitalized) {
                    // start web socket lsp client to the Web Worker python server
                    initializedAndStartLanguageClient();
                    isClientInitalized = true;
                }
            }
        }
    }, [name, language, value]);

    return <div ref={containerRef} style={style} className={className} />;
};

export default MonacoEditor;
