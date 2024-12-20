import { Layout, Model, IJsonModel, TabNode } from 'flexlayout-react';
import React, { useEffect } from 'react'
// import XRPShell from './xrpshell';
import 'flexlayout-react/style/dark.css';
import Folder from './folder';
import MicroPythonEditor from './editor';
import dynamic from 'next/dynamic';
import BlocklyEditor from './blockly';
import EditorChooser from './editor_chooser';

const XRPShell = dynamic(() => import('../components/xrpshell'));

/**
*  Layout-React's layout JSON to specify the XRPWeb's single page application's layout
*/
const layout_json : IJsonModel = {
    global: {"tabEnablePopout": false},
    borders: [
      {
          type: "border",
          location: "left",
          enableDrop: false,
          size: 250,
          children: [
            {
                type: "tab",
                name: "Folders",
                component: "folders",
                enableClose: false,
                icon: 'folder.svg',
            }
          ]
      }
    ],
    layout: {
          type: "row",
          weight: 100,
          children: [
              {
                  type: "row",
                  weight: 80,
                  children: [
                      {
                          type: "tabset",
                          weight: 70,
                          children: [
                              {
                                  id: "chooserId",
                                  type: "tab",
                                  name: "Choose Mode",
                                  component: "editor-chooser",
                                  enableClose: true
                              }
                          ]
                      },
                      {
                        type: "tabset",
                        weight: 30,
                        children: [
                            {
                                type: "tab",
                                name: "Shell",
                                component: "xterm",
                                enableClose: false
                            }
                        ]
                      }
                  ]
              }
          ]
    }
  };

const model = Model.fromJson(layout_json);
let layoutRef : React.RefObject<Layout> = {
    current: null
  };  
  
const factory = (node: TabNode) => {
    const component = node.getComponent();
    if (component == "editor") {
        return <MicroPythonEditor />
    } else if (component == "xterm") {
        return <XRPShell />
    } else if (component == "folders") {
        return <Folder />
    } else if (component == "blockly") {
      return <BlocklyEditor />
    } else if (component == "editor-chooser") {
        return <EditorChooser ref={layoutRef} />
    }
}

/**
 * 
 * @returns React XRPLayout component
 */
function XRPLayout({forwardedref}) {
    
    useEffect(() => {
        layoutRef = forwardedref;
    }, []);

    return (
        <Layout 
            ref={forwardedref} 
            model={model} 
            factory={factory} 
        />
    ) 
}

export default XRPLayout;