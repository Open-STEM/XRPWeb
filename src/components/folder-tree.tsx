import { FolderItem, ViewType } from '@/utils/types';
import { Tree, NodeApi, NodeRendererProps } from 'react-arborist';
import { RiArrowDownSFill, RiArrowRightSFill } from 'react-icons/ri';
import { useEffect, useRef, useState } from 'react';
import AppMgr, { EventType } from '@/managers/appmgr';
import useResizeObserver from 'use-resize-observer';
import i18n from '@/utils/i18n';
import { FaRegFolder } from 'react-icons/fa';
import { FaFileAlt } from 'react-icons/fa';
import BlocklyIcon from './icons/blockly-icon';
import MicropythonIcon from './icons/micropython-icon';
import { MdEdit } from 'react-icons/md';
import { MdDeleteOutline } from 'react-icons/md';
import FolderHeader from './folder-header';
import uniqueId from '@/utils/unique-id';
import { useReadLocalStorage } from 'usehooks-ts';
import { StorageKeys } from '@/utils/localstorage';
import { CommandToXRPMgr } from '@/managers/commandstoxrpmgr';

type TreeProps = {
    treeData: string | null;
    theme: string;
    isHeader?: boolean;
};

/**
 * Folder component
 * @param treeProps
 * @returns
 */
function FolderTree(treeProps: TreeProps) {
    const [treeData, setTreeData] = useState<FolderItem[] | undefined>(undefined);
    const [selectedItems, setSelectedItems] = useState<FolderItem[] | undefined>(undefined);
    const [isConnected, setIsConnected] = useState(false);
    const appMgrRef = useRef<AppMgr>();
    const treeRef = useRef(null);
    const { ref, width, height } = useResizeObserver();
    const viewType = useReadLocalStorage(StorageKeys.VIEWSETTING);

    useEffect(() => {
        // If treeData is passed as a prop, build the tree
        if (treeProps.treeData) {
            const data = JSON.parse(treeProps.treeData);
            setTreeData(data);
        }
    }, [treeProps.treeData]);

    useEffect(() => {
        appMgrRef.current = AppMgr.getInstance();
        appMgrRef.current.on(EventType.EVENT_FILESYS, (filesysJson: string) => {
            try {
                const filesysData = JSON.parse(filesysJson);
                if (Object.keys(filesysData).length === 0) {
                    setTreeData(undefined);
                } else {
                    if (viewType === ViewType.FOLDER) {
                        const root = filesysData.at(0);
                        for (const child of root.children) {
                            if (child.name === 'lib') {
                                const index = root.children.indexOf(child);
                                root.children.splice(index, 1);
                                break;
                            }
                        }
                        setTreeData(filesysData);
                    } else {
                        setTreeData(filesysData);
                    }
                    appMgrRef.current?.setFoderData(filesysData);
                }
                setIsConnected(true);
            } catch (err) {
                console.log(err);
                setTreeData(undefined);
            }
        });
    }, [viewType]);

    function Input({ node }: { node: NodeApi<FolderItem> }) {
        return (
            <input
                autoFocus
                type="text"
                defaultValue={node.data.name}
                onFocus={(e) => e.currentTarget.select()}
                onBlur={() => node.reset()}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') node.reset();
                    if (e.key === 'Enter') node.submit(e.currentTarget.value);
                }}
            />
        );
    }

    function Node({ node, style, dragHandle, tree }: NodeRendererProps<FolderItem>) {
        let Icon = null;
        if (node.data.name.includes('.py')) {
            Icon = MicropythonIcon;
        } else if (node.data.name.includes('.blocks')) {
            Icon = BlocklyIcon;
        } else if (node.children && node.children.length > 0) {
            Icon = FaRegFolder;
        } else {
            Icon = FaFileAlt;
        }

        return (
            <div
                ref={dragHandle}
                style={style}
                className={`group flex flex-row items-center justify-between hover:bg-matisse-400 dark:hover:bg-shark-500 ${node.isSelected ? 'bg-curious-blue-300 dark:bg-shark-400' : ''}`}
                onClick={() => node.isInternal && node.toggle()}
            >
                <div className="flex flex-row items-center">
                    {node.isLeaf === false &&
                        (node.isOpen ? <RiArrowDownSFill /> : <RiArrowRightSFill />)}
                    <span>
                        <Icon />
                    </span>
                    <span className="mx-1">
                        {node.isEditing ? <Input node={node} /> : node.data.name}
                    </span>
                </div>
                <div className="invisible flex flex-row items-center gap-1 px-2 group-hover:visible">
                    <button onClick={() => node.edit()} title={i18n.t('rename')}>
                        <MdEdit size={'1.5em'} />
                    </button>
                    <button
                        onClick={() => {
                            tree.delete(node.id);
                        }}
                        title={i18n.t('delete')}
                    >
                        <MdDeleteOutline size={'1.5em'} />
                    </button>
                </div>
            </div>
        );
    }

    /**
     * Find the item in the tree
     * @param node
     * @param id
     * @returns
     *      Parent node
     *      found item
     */
    const findItem = (node: FolderItem | undefined, id: string): FolderItem | null => {
        if (!node) return null;
        if (node.id === id) return node as FolderItem;
        if (node.children) {
            for (const child of node.children) {
                const found = findItem(child, id);
                if (found) {
                    // the parent node infor is for deleting the node
                    if (found.parent === undefined) {
                        found.parent = node;
                    }
                    return found;
                }
            }
            return null;
        }
        return null;
    };

    /**
     * onDelete - delete tree item callback. Multiple tree items can be deleted at the same time.
     * @param param0
     */
    const onDelete = ({ ids, nodes }: { ids: string[]; nodes: NodeApi<FolderItem>[] }) => {
        console.log(`Deleting nodes with ids: ${ids.join(', ')}`);
        const rootNode = treeData?.at(0);
        const found = findItem(rootNode, nodes[0].data.id);

        if (found) {
            const index = found.parent?.children?.indexOf(found);
            if (index !== undefined && index !== -1) {
                found.parent?.children?.splice(index, 1);
            }

            // delete the actual file in XRP
            CommandToXRPMgr.getInstance().deleteFileOrDir(found.path + '/' + found.name);
        }
    };

    /**
     * onRename - rename tree item callback
     * @param id, name, and node
     */
    const onRename = async ({
        id,
        name,
        node,
    }: {
        id: string;
        name: string;
        node: NodeApi<FolderItem>;
    }) => {
        console.log(`Renaming node with id: ${id}, name: ${name} node: ${node.data}`);
        const rootNode = treeData?.at(0);
        const found = findItem(rootNode, node.data.id);

        if (found) {
            // rename the actual file in XRP
            await CommandToXRPMgr.getInstance().renameFile(found.path + '/' + found.name, name);
            // update the name field
            found.name = name;
        }
    };
    const onCreate = async ({
        parentId,
        parentNode,
        index,
        type,
    }: {
        parentId: string | null;
        parentNode: NodeApi<FolderItem> | null;
        index: number;
        type: 'internal' | 'leaf';
    }) => {
        console.log('Create node:', { parentId, parentNode, index, type });
        // Generate a unique ID for the new node
        const newId = uniqueId(parentNode?.data.name || `node`);

        // Create the new node object
        const newNode: FolderItem = {
            id: newId,
            name: type === 'internal' ? i18n.t('newFolder') : i18n.t('newFile'),
            isReadOnly: false,
            children: type === 'internal' ? [] : null,
            path: `${parentNode?.data.path}/${parentNode?.data.name}/`,
        };

        // Update the tree data
        setTreeData((prevTreeData) => {
            if (!prevTreeData) return prevTreeData;

            const rootNode = prevTreeData.at(0);
            if (!rootNode) return prevTreeData;

            if (parentNode) {
                const found = findItem(rootNode, parentNode.data.id);
                if (found) {
                    found.children = found.children || [];
                    found.children.splice(index, 0, newNode);
                }
            } else {
                rootNode.children = rootNode.children || [];
                rootNode.children.splice(index, 0, newNode);
            }

            return [...prevTreeData];
        });

        if (newNode) {
            if (type === 'internal') {
            // create the actual file in XRP
                await CommandToXRPMgr.getInstance().buildPath(newNode.path + '/' + newNode.name);
            } else if (type === 'leaf') {
                // create the actual file in XRP
                await CommandToXRPMgr.getInstance().uploadFile(newNode.path + '/' + newNode.name, '', true);
            }
        }

        return newNode;
    };

    // const onMove = ({ dragIds, dragNodes, parentId, parentNode, index }: { dragIds: string[], dragNodes: NodeApi<FolderItem>[], parentId: string | null, parentNode: NodeApi<FolderItem> | null, index: number }) => {
    //     console.log('Moved nodes:', dragIds, 'to parent:', parentId, 'at index:', index);
    // };{

    const onSelected = (nodes: NodeApi<FolderItem>[]) => {
        console.log(`Selected nodes: ${nodes.map((node) => node.data.name).join(', ')}`);
        const selectedItems: FolderItem[] = [];
        nodes.map((node) => selectedItems.push(node.data));
        setSelectedItems(selectedItems);
    };

    // const onMenuDelete = () => {
    //     console.log('onMenuDelete', selectedItems?.length);
    // };
    // const onMenuRename = () => {
    //     console.log('onMenuRename');
    // };
    // const onMenuNew = () => {
    //     console.log('onMenuNew');
    // };
    // const onMenuExport = () => {
    //     console.log('onMenuExport');
    // };

    // const menuItems: MenuDataItem[] = [
    //     {
    //         label: i18n.t('delete'),
    //         iconImage: deleteIcon,
    //         clicked: onMenuDelete,
    //     },
    //     {
    //         label: i18n.t('rename'),
    //         iconImage: renameIcon,
    //         clicked: onMenuRename,
    //     },
    //     {
    //         label: i18n.t('new'),
    //         iconImage: fileNewIcon,
    //         clicked: onMenuNew,
    //     },
    //     {
    //         label: i18n.t('exportToPC'),
    //         iconImage: exportIcon,
    //         clicked: onMenuExport,
    //     },
    // ];

    /**
     * onOpenFolder - open the selected folder
     */
    function onOpenFolder(): void {
        if (selectedItems && selectedItems[0] && selectedItems[0].children === null) {
            return;
        }

        const tree =
            treeData
                ?.at(0)
                ?.children?.filter((folder) => folder.name === selectedItems?.[0]?.name) || [];
        if (tree) {
            setTreeData(tree);
        }
    }

    /**
     * onCloseFolder - close the selected folder
     */
    function onCloseFolder(): void {
        CommandToXRPMgr.getInstance().getOnBoardFSTree();
    }

    function onNewFolder(): void {
        if (treeRef.current) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            treeRef.current.createInternal();
        }
    }

    function onNewFile(): void {
        if (treeRef.current) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            treeRef.current.createLeaf();
        }
    }

    return (
        // <ContextMenu items={menuItems}>
            <div className="flex flex-col gap-1">
                {treeProps.isHeader && isConnected && (
                    <FolderHeader
                        openFolderCallback={onOpenFolder}
                        closeFolderCallback={onCloseFolder}
                        newFileCallback={onNewFile}
                        newFolderCallback={onNewFolder}
                        storageCapacity="14/135MB"
                    />
                )}
                <div ref={ref} style={{ height: treeProps.treeData ? '50vh' : '100vh' }}>
                    <Tree
                        ref={treeRef}
                        className="text-md border border-shark-200 bg-mountain-mist-100 text-shark-900 dark:border-shark-950 dark:bg-mountain-mist-950 dark:text-shark-200"
                        data={treeData}
                        width={width}
                        height={height}
                        rowHeight={24}
                        renderCursor={() => 'default'}
                        openByDefault={false}
                        initialOpenState={{ root: true }}
                        paddingBottom={32}
                        disableEdit={(data) => data.isReadOnly}
                        disableDrag={true}
                        disableDrop={true}
                        onDelete={onDelete}
                        onRename={onRename}
                        onSelect={onSelected}
                        onCreate={onCreate}
                    >
                        {Node}
                    </Tree>
                </div>
            </div>
        // </ContextMenu>
    );
}

export default FolderTree;
