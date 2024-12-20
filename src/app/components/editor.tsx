import React, { useRef } from 'react'
import { Editor, Monaco } from '@monaco-editor/react';

type Props = {}

function MicroPythonEditor({}: Props) {
    const editorRef = useRef(null);
    const monacoRef = useRef(null);

    function handleEditorDidMount(editor, monaco: Monaco) {
        // here is the editor instance
        // you can store it in `useRef` for further usage
        editorRef.current = editor;
        monacoRef.current = monaco;
    }

    return (
        <Editor
            defaultLanguage="python"
            theme='vs-dark'
            onMount={handleEditorDidMount}
        />
    )
}

export default MicroPythonEditor