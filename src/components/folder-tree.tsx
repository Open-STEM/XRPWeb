import { FolderItem, ModeType } from '@/utils/types';
import { Tree, NodeApi, NodeRendererProps } from 'react-arborist';
import { RiArrowDownSFill, RiArrowRightSFill } from 'react-icons/ri';
import { useEffect, useRef, useState } from 'react';
import AppMgr, { EventType } from '@/managers/appmgr';
import useResizeObserver from 'use-resize-observer';
import i18n from '@/utils/i18n';
import { FaRegFolder } from 'react-icons/fa';
import { FaFileAlt } from 'react-icons/fa';
import BlocklyIcon from '@/components/icons/blockly-icon';
import MicropythonIcon from '@/components/icons/micropython-icon';
import { MdEdit } from 'react-icons/md';
import { MdDeleteOutline } from 'react-icons/md';
import FolderHeader from './folder-header';
import uniqueId from '@/utils/unique-id';
import { StorageKeys } from '@/utils/localstorage';
import { CommandToXRPMgr } from '@/managers/commandstoxrpmgr';
import logger from '@/utils/logger';
import { Constants } from '@/utils/constants';
import { ConnectionState } from '@/connections/connection';

type TreeProps = {
    treeData: string | null;
    onSelected?: (selectedItem: FolderItem) => void;
    theme: string;
    isHeader?: boolean;
};

let hasSubscribed = false;

/**
 * Folder component
 * @param treeProps
 * @returns
 */
function FolderTree(treeProps: TreeProps) {
    const [isConnected, setConnected] = useState(false);
    const [capacity, setCapacity] = useState<string>('0/0');
    const [treeData, setTreeData] = useState<FolderItem[] | undefined>(undefined);
    const [selectedItems, setSelectedItems] = useState<FolderItem[] | undefined>(undefined);
    const appMgrRef = useRef<AppMgr>();
    const treeRef = useRef(null);
    const { ref, width, height } = useResizeObserver();
    const [modeType, setModeType] = useState<number>(0);
    const folderLogger = logger.child({ module: 'folder-tree' });
    const isLogin = AppMgr.getInstance().authService.isLogin;

    useEffect(() => {
        // If treeData is passed as a prop, build the tree
        if (treeProps.treeData) {
            const data = JSON.parse(treeProps.treeData);
            setTreeData(data);
        }
    }, [treeProps.treeData]);

    useEffect(() => {
        if (!hasSubscribed) {
            appMgrRef.current = AppMgr.getInstance();

            AppMgr.getInstance().on(EventType.EVENT_CONNECTION_STATUS, (state: string) => {
                if (state === ConnectionState.Connected.toString()) {
                    setConnected(true);
                }
            });
            
            appMgrRef.current.on(EventType.EVENT_FILESYS, (filesysJson: string) => {
                try {
                    const filesysData = JSON.parse(filesysJson);
                    // remove admin.json from the filesysData
                    if (filesysData && filesysData.length > 0) {
                        filesysData.forEach((item: FolderItem) => {
                            if (item.children) {
                                item.children = item.children.filter(
                                    (child) => child.name !== Constants.ADMIN_FILE,
                                );
                            }
                        });
                    }
                    const mode = parseInt(localStorage.getItem(StorageKeys.MODESETTING) ?? '0');
                    const selectedUser = localStorage.getItem(StorageKeys.XRPUSER)?.replace(/"/g, '');
                    setModeType(mode);
                    if (Object.keys(filesysData).length === 0) {
                        setTreeData(undefined);
                    } else {
                        if (mode === ModeType.USER) {
                            const root = filesysData.at(0);
                            for (const child of root.children) {
                                if (child.name === 'lib') {
                                    const index = root.children.indexOf(child);
                                    root.children.splice(index, 1);
                                    break;
                                }
                            }
                            const node = findNodeByName(filesysData, selectedUser ?? undefined);
                            const treeData: FolderItem[] = node ? [node] : [];
                            setTreeData(treeData);
                        } else if (mode === ModeType.GOOUSER) {
                            if (filesysData.at(0)?.name !== '/')
                                setTreeData(filesysData);
                        } else {
                            setTreeData(filesysData);
                        }
                        appMgrRef.current?.setFoderData(filesysData);
                    }
                } catch (err) {
                    setTreeData(undefined);
                    folderLogger.error('Failed to parse filesys data', err);
                }
            });

            AppMgr.getInstance().on(EventType.EVENT_FILESYS_STORAGE, (storageCapacity: string) => {
                // Update the storage capacity state here
                folderLogger.debug(`Storage capacity changed to: ${storageCapacity}`);
                const storage = JSON.parse(storageCapacity);
                setCapacity(storage.used + '/' + storage.total);
            });
            hasSubscribed = true;
        }
    }, [modeType]);

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
        } else if (node.children) {
            Icon = FaRegFolder;
        } else {
            Icon = FaFileAlt;
        }

        return (
            <div
                ref={dragHandle}
                style={style}
                className={`group flex flex-row items-center justify-between hover:bg-matisse-400 dark:hover:bg-shark-500 ${node.isSelected ? 'bg-curious-blue-300 dark:bg-shark-400' : ''}`}
                onClick={(e) => {
                    if (node.isInternal) node.toggle();
                    if (!(e.detail % 2)) {
                        if (node.children === null) {
                            const filePath =
                                node.data.path === '/'
                                    ? node.data.path + node.data.name
                                    : node.data.path + '/' + node.data.name;
                            const filePathData = {
                                xrpPath: filePath,
                                gPath: node.data.fileId
                            };
                            AppMgr.getInstance().emit(EventType.EVENT_OPEN_FILE, JSON.stringify(filePathData));
                        }
                    }
                }}
            >
                <div className="flex flex-row items-center">
                    {node.isLeaf === false &&
                        (node.isOpen ? <RiArrowDownSFill /> : <RiArrowRightSFill />)}
                    <span>
                        <Icon />
                    </span>
                    <span className="overflow-wrap mx-1 whitespace-nowrap">
                        {node.isEditing ? <Input node={node} /> : node.data.name}
                    </span>
                </div>
                {!treeProps.onSelected && (
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
                )}
            </div>
        );
    }

    /**
     * findNodeByName - find the node in the tree by name
     * @param nodes
     * @param name
     * @returns the node
     */
    const findNodeByName = (
        nodes: FolderItem[],
        name: string | undefined,
    ): FolderItem | undefined => {
        for (const node of nodes) {
            if (node.name === name) {
                return node;
            }
            if (node.children) {
                const foundChild = findNodeByName(node.children, name);
                if (foundChild) {
                    return foundChild;
                }
            }
        }
        return undefined;
    };

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
    const onDelete = async ({ ids, nodes }: { ids: string[]; nodes: NodeApi<FolderItem>[] }) => {
        folderLogger.debug(`Deleting nodes with ids: ${ids.join(', ')}`);
        const rootNode = treeData?.at(0);
        const found = findItem(rootNode, nodes[0].data.id);

        if (found) {
            const index = found.parent?.children?.indexOf(found);
            if (index !== undefined && index !== -1) {
                found.parent?.children?.splice(index, 1);
            }

            if (isConnected) {
                // delete the actual file in XRP
                await CommandToXRPMgr.getInstance().deleteFileOrDir(found.path + '/' + found.name);
            }

            if (modeType === ModeType.GOOUSER && isLogin) {
                // delete the actual file in Google Drive
                if (found.fileId) {
                    await AppMgr.getInstance().driveService?.DeleteFile(found.fileId);
                }
            }
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
        folderLogger.debug(`Renaming node with id: ${id}, name: ${name} node: ${node.data}`);
        const rootNode = treeData?.at(0);
        const found = findItem(rootNode, node.data.id);

        if (found) {
            if (isConnected) {
                // rename the actual file in XRP
                await CommandToXRPMgr.getInstance().renameFile(found.path + '/' + found.name, name);
            }

            if (modeType === ModeType.GOOUSER && isLogin) {
                // rename the actual file in Google Drive
                await AppMgr.getInstance().driveService?.renameFile(found.fileId ?? '', name);
            }
            // update the name field
            found.name = name;
        }
    };

    /**
     * onCreate - create a new tree item callback
     * @param param0 
     * @returns 
     */
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
        folderLogger.debug('Create node:', { parentId, parentNode, index, type });
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
            let parentFileId = null;
            if (parentNode === null) {
                const rootNode = treeData?.at(0);
                parentFileId = rootNode?.fileId;
            } else {
                parentFileId = parentNode.data.fileId;
            }
            if (type === 'internal') {
                if (isConnected) {
                    // create the actual file in XRP
                    await CommandToXRPMgr.getInstance().buildPath(
                        newNode.path + '/' + newNode.name,
                    );
                } 
                if (modeType === ModeType.GOOUSER && isLogin) {
                    await AppMgr.getInstance().driveService?.createFolder(newNode.name,  parentFileId ?? undefined).then((data) => {
                        newNode.fileId = data?.id;
                    });               
                }
            } else if (type === 'leaf') {
                if (isConnected) {
                    // create the actual file in XRP
                    await CommandToXRPMgr.getInstance().uploadFile(
                        newNode.path + '/' + newNode.name,
                        '',
                        true,
                    );
                } 
                if (modeType === ModeType.GOOUSER && isLogin) {
                    const mintetype = newNode.name.includes('.py')
                        ? 'text/x-python' : newNode.name.includes('.blocks')
                        ? 'application/json' : 'text/plain';
                    const blob = new Blob([''], { type: mintetype });
                    await AppMgr.getInstance().driveService?.uploadFile(blob, newNode.name, mintetype, parentFileId ?? undefined).then((file) => {
                        if (file) {
                            newNode.fileId = file.id;
                        }
                    });
                }
            }
        }

        return newNode;
    };

    // const onMove = ({ dragIds, dragNodes, parentId, parentNode, index }: { dragIds: string[], dragNodes: NodeApi<FolderItem>[], parentId: string | null, parentNode: NodeApi<FolderItem> | null, index: number }) => {
    //     console.log('Moved nodes:', dragIds, 'to parent:', parentId, 'at index:', index);
    // };{

    const onSelected = (nodes: NodeApi<FolderItem>[]) => {
        // console.log(`Selected nodes: ${nodes.map((node) => node.data.name).join(', ')}`);
        const selectedItems: FolderItem[] = [];
        nodes.map((node) => selectedItems.push(node.data));
        if (treeProps.onSelected && selectedItems.length > 0) {
            treeProps.onSelected(selectedItems[0]);
        }
        setSelectedItems(selectedItems);
    };

    /**
     * onOpenFolder - open the selected folder
     */
    function onOpenFolder(): void {
        if (selectedItems && selectedItems[0] && selectedItems[0].children === null) {
            return;
        }

        const node = findNodeByName(treeData || [], selectedItems?.[0]?.name);
        const tree = node ? [node] : [];
        if (tree && tree.length > 0) {
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
        <div className="flex flex-col gap-1">
            {treeProps.isHeader && (isConnected || isLogin) &&(
                <FolderHeader
                    openFolderCallback={onOpenFolder}
                    closeFolderCallback={onCloseFolder}
                    newFileCallback={onNewFile}
                    newFolderCallback={onNewFolder}
                    storageCapacity={capacity}
                />
            )}
            <div ref={ref} style={{ height: treeProps.treeData ? '40vh' : '100vh' }}>
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
    );
}

export default FolderTree;
