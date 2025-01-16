import '@codingame/monaco-vscode-python-default-extension';
import "@codingame/monaco-vscode-theme-defaults-default-extension";
import { useEffect, useMemo, useRef } from 'react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { initialize } from 'vscode/services'
import getLanguagesServiceOverride from "@codingame/monaco-vscode-languages-service-override";
import getThemeServiceOverride from "@codingame/monaco-vscode-theme-service-override";
import getTextMateServiceOverride from "@codingame/monaco-vscode-textmate-service-override";
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getConfigurationServiceOverride, { updateUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override';
import { ExtensionHostKind, registerExtension } from 'vscode/extensions';
// we need to import this so monaco-languageclient can use vscode-api
import "vscode/localExtensionHost";
import { initializedAndStartLanguageClient } from './lsp-client';

const languageId = "python";
let isClientInitalized : boolean = false;

export type WorkerLoader = () => Worker;
const workerLoaders: Partial<Record<string, WorkerLoader>> = {
    TextEditorWorker: () => new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
    TextMateWorker: () => new Worker(new URL('@codingame/monaco-vscode-textmate-service-override/worker', import.meta.url), { type: 'module' }),
};

window.MonacoEnvironment = {
  getWorker: function (_moduleId, label) {
	console.log('getWorker', _moduleId, label);
	const workerFactory = workerLoaders[label]
    if (workerFactory != null) {
      return workerFactory()
    }
	throw new Error(`Worker ${label} not found`)
  }
}

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
        vscode: '^1.78.0'
    },
    contributes: {
        languages: [{
            id: languageId,
            aliases: [
                'Python'
            ],
            extensions: [
                '.py',
                '.pyi'
            ]
        }],
        commands: [{
            command: 'pyright.restartserver',
            title: 'Pyright: Restart Server',
            category: 'Pyright'
        },
        {
            command: 'pyright.organizeimports',
            title: 'Pyright: Organize Imports',
            category: 'Pyright'
        }],
        keybindings: [{
            key: 'ctrl+k',
            command: 'pyright.organizeimports',
            when: 'editorTextFocus'
        }]
    }
  };

registerExtension(extension, ExtensionHostKind.LocalProcess);

type MonacoEditorProps = {
    /**
     * Height of the editor container
     */
    width : number | string,
    /**
     * Width of the editor container
     */
    height: number | string,
    /**
     * Class name of the editor container
     */
    className?: string,
    /**
     * Language of the current model
     */
    language?: string,
    /**
     * Path of the file
     */
    // path?: string,
    /**
     * Value of the current model
     */
    value?: string
}

const MonacoEditor = ({
        width = '100vw',
        height = '100vh',
        language = 'python',
        value,
        className
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
        if (containerRef.current) {          
            if (editor.current == null) {
                updateUserConfiguration(`{
                    "editor.fontSize": 14,
                    "workbench.colorTheme": "Default Dark Modern"
                }`);

                editor.current = monaco.editor.create(containerRef.current, {
                    value: value,
                    language: language,
                });

                monaco.editor.onDidCreateEditor(codeEditor => {
                    console.log('Editor created', codeEditor.getId);
                })

                if (!isClientInitalized) {
                    // start web socket lsp client to the Web Worker python server
                    initializedAndStartLanguageClient();
                    isClientInitalized = true;
                }
            }
        };
    }, []);

    return (
        <div 
            ref={containerRef}
            style={style}
            className={className}
        />
    )
}

export default MonacoEditor;