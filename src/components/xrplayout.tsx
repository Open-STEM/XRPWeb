import { Layout, Model, IJsonModel, TabNode } from 'flexlayout-react';
import React, { useEffect } from 'react'
// import XRPShell from './xrpshell';
import 'flexlayout-react/style/dark.css';
import Folder from './folder';
import BlocklyEditor from '@components/blockly';
import EditorChooser from '@components/editor_chooser';
import MonacoEditor from '@components/MonacoEditor';
import XRPShell from '@components/xrpshell';
import FolderIcon from '@assets/images/folder-24.png';

/**
*  Layout-React's layout JSON to specify the XRPWeb's single page application's layout
*/
const layout_json : IJsonModel = {
    global: {
        tabEnablePopout: false,
        tabSetEnableDeleteWhenEmpty: false,
        tabSetEnableDrag: false,
        tabSetEnableDrop: false,
    },
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
                icon: FolderIcon,
            }
          ]
      }
    ],
    layout: {
          type: "row",
          id: "mainRowId",
          weight: 100,
          children: [
              {
                  type: "row",
                  id: "combinedRowId",
                  name: "row-combined",
                  weight: 80,
                  children: [
                      {
                          type: "tabset",
                          id: "editorTabSetId",
                          name: "editorTabset",
                          weight: 70,
                          children: [
                              {
                                  id: "chooserId",
                                  type: "tab",
                                  name: "Choose Mode",
                                  component: "editor-chooser",
                                  enableClose: true
                              },
                          ]
                      },
                      {
                        type: "tabset",
                        id: "shellTabsetId",
                        name: "shellTabset",
                        weight: 30,
                        children: [
                            {
                                type: "tab",
                                id: "shellId",
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
        return <MonacoEditor width='100vw' height='100vh'/>
    } else if (component == "xterm") {
        return <XRPShell />
    } else if (component == "folders") {
        return <Folder treeItems='json'/>
    } else if (component == "blockly") {
      return <BlocklyEditor />
    } else if (component == "editor-chooser") {
        return <EditorChooser flref={layoutRef} />
    }
}

type XRPLayoutProps = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    forwardedref: any
}

/**
 * 
 * @returns React XRPLayout component
 */
function XRPLayout({forwardedref}: XRPLayoutProps) {
    
    useEffect(() => {
        layoutRef = forwardedref;
    }, [forwardedref]);

    return (
        <Layout 
            ref={forwardedref} 
            model={model} 
            factory={factory}
        />
    ) 
}

export default XRPLayout;