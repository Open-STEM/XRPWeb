import React from 'react'
import { BlocklyWorkspace } from 'react-blockly'
import BlocklyConfigs from './blockly/xrp_blockly_configs';

type Props = {}

function BlocklyEditor({}: Props) {
  return (
    <BlocklyWorkspace
        className="h-full" // you can use whatever classes are appropriate for your app's CSS
        toolboxConfiguration={BlocklyConfigs.ToolboxJson} // this must be a JSON toolbox definition
        workspaceConfiguration={{
            grid: {
            spacing: 20,
            length: 3,
            colour: "#ccc",
            snap: true,
            },
        }}
        initialJson={BlocklyConfigs.InitialJson}
    />
  )
}

export default BlocklyEditor