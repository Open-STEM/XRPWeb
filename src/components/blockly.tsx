import { pythonGenerator } from 'blockly/python';
import { BlocklyWorkspace, Workspace } from 'react-blockly';
import BlocklyConfigs from '@components/blockly/xrp_blockly_configs';

function BlocklyEditor() {
    function onWorkspaceDidChange(ws: Workspace | undefined) {
        const code = pythonGenerator.workspaceToCode(ws);
        console.log(code);
    }

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
            }}
            initialJson={BlocklyConfigs.InitialJson}
            onWorkspaceChange={onWorkspaceDidChange}
        />
    );
}

export default BlocklyEditor;
