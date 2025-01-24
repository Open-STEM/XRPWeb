import AppMgr, { EventType } from '@/managers/appmgr';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StaticTreeDataProvider, Tree, UncontrolledTreeEnvironment } from 'react-complex-tree';
import 'react-complex-tree/lib/style-modern.css';

type TreeProps = {
    treeData: string | null;
}

/**
 * buildTree - function to build the tree from JSON
 * @param template - JSON template
 * @param data - data to build the tree
 * @returns 
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildTree = (template: any, data: any = { items: {} }): any => {
  for (const [key, value] of Object.entries(template)) {
      data.items[key] = {
          index: key,
          canMove: true,
          isFolder: value !== null,
          children:
            value !== null
              ? Object.keys(value as Record<string, unknown>)
              : undefined,
          data: key,
          canRename: true,
      };
  
      if (value !== null) {
          buildTree(value, data);
      }
  }
  return data;
};

// const treeData = buildTree(shortTreeTemplate);

/**
 * Folder component
 * @param treeProps
 * @returns 
 */
function Folder(treeProps: TreeProps) {
    const [treeData, setTreeData] = useState({ items: {} });
    const appMgrRef = useRef<AppMgr>();

    useEffect(() => {
        // If treeData is passed as a prop, build the tree
        if (treeProps.treeData) {
            const treeItems = buildTree(JSON.parse(treeProps.treeData));
            console.log(treeItems);
            setTreeData(treeItems);
        } 

        // If treeData is not passed as a prop, get the tree data from the FilesysMgr's publish event
        if (!appMgrRef.current && !treeProps.treeData) {
          appMgrRef.current = AppMgr.getInstance();
          appMgrRef.current.on(EventType.EVENT_FILESYS, (filesysJson: string) => {
              console.log('EVENT_FILESYS', filesysJson);
              const treeItems = buildTree(JSON.parse(filesysJson));
              setTreeData(treeItems);
          });
      }        
    }, [treeProps.treeData]);

    const items = useMemo(() => ({ ...treeData.items}), [treeData.items]);
    const dataProvider = useMemo(
        () => new StaticTreeDataProvider(items, (item, data) => ({
            ...item,
            data
        })),
        [items]
    );

    return (
      <UncontrolledTreeEnvironment
        dataProvider={dataProvider}
        getItemTitle={item => item.data}
        viewState={{}}
        canDragAndDrop={true}
        canDropOnFolder={true}
        canReorderItems={true}
      >
        <div className="rct-dark">
          <Tree treeId="tree-2" rootItem="root" treeLabel="Tree Example" />
        </div>
      </UncontrolledTreeEnvironment>
    )
}

export default Folder;