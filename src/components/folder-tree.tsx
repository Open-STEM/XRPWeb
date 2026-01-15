import { FolderItem } from '@/utils/types';
import { Tree, NodeApi, NodeRendererProps } from 'react-arborist';
import { RiArrowDownSFill, RiArrowRightSFill } from 'react-icons/ri';
import { useEffect, useRef, useState } from 'react';
import AppMgr, { EventType, LoginStatus } from '@/managers/appmgr';
import useResizeObserver from 'use-resize-observer';
import { FaRegFolder } from 'react-icons/fa';
import { FaFileAlt } from 'react-icons/fa';
import BlocklyIcon from '@/components/icons/blockly-icon';
import MicropythonIcon from '@/components/icons/micropython-icon';
import { MdEdit } from 'react-icons/md';
import { MdDeleteOutline } from 'react-icons/md';
import FolderHeader from './folder-header';
import uniqueId from '@/utils/unique-id';
import { CommandToXRPMgr } from '@/managers/commandstoxrpmgr';
import logger from '@/utils/logger';
import { Constants } from '@/utils/constants';
import { ConnectionState } from '@/connections/connection';
import { useTranslation } from 'react-i18next';
import Dialog from './dialogs/dialog';
import ConfirmationDlg from './dialogs/confirmdlg';
import AlertDialog from './dialogs/alertdlg';
import { fireGoogleUserTree, getUsernameFromEmail } from '@/utils/google-utils';
import EditorMgr from '@/managers/editormgr';
import Login from '@/widgets/login';
import { UserProfile } from '@/services/google-auth';

type TreeProps = {
    treeData: string | null;
    onSelected?: (selectedItem: FolderItem) => void;
    theme: string;
    isHeader?: boolean;
};

/**
 * Folder component
 * @param treeProps
 * @returns
 */
function FolderTree(treeProps: TreeProps) {
    const { t } = useTranslation();
    const [isConnected, setConnected] = useState(false);
    const [isLogin, setIsLogin] = useState(false);
    const [capacity, setCapacity] = useState<string>('0/0');
    const [treeData, setTreeData] = useState<FolderItem[] | undefined>(undefined);
    const [, setSelectedItems] = useState<FolderItem[] | undefined>(undefined);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const appMgrRef = useRef<AppMgr>();
    const treeRef = useRef(null);
    const { ref, width, height } = useResizeObserver();
    const folderLogger = logger.child({ module: 'folder-tree' });
    const [dialogContent, setDialogContent] = useState<React.ReactNode>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [hasSubscribed, setHasSubscribed] = useState<boolean>(false);

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

            setConnected(appMgrRef.current.getConnection()?.isConnected() ?? false);

            appMgrRef.current.on(EventType.EVENT_CONNECTION_STATUS, (state: string) => {
                if (state === ConnectionState.Connected.toString()) {
                    setConnected(true);
                }
            });

            appMgrRef.current.on(EventType.EVENT_ISRUNNING, (running: string) => {
                if (running === 'running') {
                    setIsRunning(true);
                } else if (running === 'stopped') {
                    setIsRunning(false);
                }
            });
            
            appMgrRef.current.on(EventType.EVENT_FILESYS, (filesysJson: string) => {
                try {
                    const filesysData = JSON.parse(filesysJson);
                    if (Object.keys(filesysData).length === 0 && AppMgr.getInstance().authService.isLogin === true) {       
                        fireGoogleUserTree(getUsernameFromEmail(AppMgr.getInstance().authService.userProfile.email) ?? '');
                    } else if (Object.keys(filesysData).length == 0) {
                        setTreeData(undefined);
                    } else if (AppMgr.getInstance().authService.isLogin && filesysData[0].id === 'root') {
                        return;
                    } else {
                        setTreeData(filesysData);
                        appMgrRef.current?.setFoderData(filesysJson);
                    }
                } catch (err) {
                    if (err instanceof Error) {
                        folderLogger.error(`Failed to parse filesys data:  ${err.stack ?? err.message}`);
                    }
                    setTreeData(undefined);
                }
            });

            AppMgr.getInstance().on(EventType.EVENT_FILESYS_STORAGE, (storageCapacity: string) => {
                // Update the storage capacity state here
                folderLogger.debug(`Storage capacity changed to: ${storageCapacity}`);
                const storage = JSON.parse(storageCapacity);
                setCapacity(storage.used + '/' + storage.total);
            });

            setHasSubscribed(true);
        }
    }, [isConnected]);

    /**
     * toggleDialog - toggle the dialog open/close state
     */
    const toggleDialog = () => {
        if (!dialogRef.current) {
            return;
        }
        if (dialogRef.current.hasAttribute('open')) {
            dialogRef.current.close();
        }
        else dialogRef.current.showModal();
    };

    /**
     * Input component for renaming nodes
     * @param param0
     * @returns
     */
    function Input({ node }: { node: NodeApi<FolderItem> }) {
        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            const { value } = e.currentTarget;
            const lastDotIndex = value.lastIndexOf('.');

            // If it's a leaf node (a file) and has an extension, select only the name part.
            if (node.isLeaf && lastDotIndex > 0) {
                e.currentTarget.setSelectionRange(0, lastDotIndex);
            } else {
                // Otherwise, select the whole text (for folders or files without extensions).
                e.currentTarget.select();
            }
        };

        return (
            <input
                autoFocus
                type="text"
                defaultValue={node.data.name}
                onFocus={handleFocus}
                onBlur={() => node.reset()}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') node.reset();
                    if (e.key === 'Enter') {
                        const { value } = e.currentTarget;
                        // Submit the value from the input. The onRename handler will manage the extension.
                        node.submit(value);
                    }
                }}
            />
        );
    }

    /**     
     * Node component for rendering each tree node
     * @param param0
     * @returns
     */
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
                className={`group flex flex-row items-center justify-between hover:bg-matisse-400 dark:hover:bg-shark-500 ${node.isSelected ? 'bg-curious-blue-300 dark:bg-shark-400' : ''} ${isRunning ? 'opacity-50 pointer-events-none' : 'opacity-100 pointer-events-auto'}}`}
                onClick={(e) => {
                    if (node.isInternal) node.toggle();
                    if (!(e.detail % 2) && !isRunning) {
                        if (node.children === null) {
                            const username = getUsernameFromEmail(AppMgr.getInstance().authService.userProfile.email);
                            const path = node.data.path.includes('/XRPCode/')
                                ? node.data.path.replace('/XRPCode/', Constants.GUSERS_FOLDER + `${username}/`)
                                : node.data.path + '/';
                            const filePath =
                                path === '/'
                                    ? path + node.data.name
                                    : path + node.data.name;
                            const filePathData = {
                                xrpPath: filePath,
                                gPath: node.data.fileId,
                                gparentId: node.data.gparentId
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
                        <button className={`${isRunning ? 'opacity-50 pointer-events-none' : 'opacity-100 pointer-events-auto'}`} onClick={() => node.edit()} title={t('rename')}>
                            <MdEdit size={'1.5em'} />
                        </button>
                        <button className={`${isRunning ? 'opacity-50 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
                            onClick={() => {
                                tree.delete(node.id);
                            }}
                            title={t('delete')}
                        >
                            <MdDeleteOutline size={'1.5em'} />
                        </button>
                    </div>
                )}
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
    const onDelete = async ({ ids, nodes }: { ids: string[]; nodes: NodeApi<FolderItem>[] }) => {
        folderLogger.debug(`Deleting nodes with ids: ${ids.join(', ')}`);
        const rootNode = treeData?.at(0);
        const found = findItem(rootNode, nodes[0].data.id);

        /**
         * handleOnDeleteConfirmation - handle the delete confirmation
         */
        const handleOnDeleteConfirmation = async () => {
            toggleDialog();
            if (found) {
                if (isLogin) {
                    // delete the actual file in Google Drive
                    if (found.fileId) {
                        await AppMgr.getInstance().driveService?.DeleteFile(found.fileId);
                        const username = getUsernameFromEmail(AppMgr.getInstance().authService.userProfile.email);
                        if (username) {
                            // refresh the Google Drive tree
                            fireGoogleUserTree(username);
                        }
                    }
                } else if (isConnected) {
                    // delete the actual file in XRP
                    await CommandToXRPMgr.getInstance().deleteFileOrDir(found.path + '/' + found.name);
                }

                // remove the node from the tab and editor manager
                const editorMgr = EditorMgr.getInstance();
                const editorSession = editorMgr.getEditorSession(found.name);
                if (editorSession) {
                    editorMgr.RemoveEditor(found.name);
                    editorMgr.RemoveEditorTab(found.name);
                }
            }
        };

        if (found) {
            setDialogContent(<ConfirmationDlg acceptCallback={handleOnDeleteConfirmation} toggleDialog={toggleDialog} confirmationMessage={t('confirmDeleteFileOrFolder', { name: found.name })} />);
            toggleDialog();
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
            // Preserve file extension if user omits it
            const originalName = found.name;
            const originalExtension = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')) : '';

            if (originalExtension && !name.endsWith(originalExtension) && !name.includes('.')) {
                name += originalExtension;
            }

            if (isLogin) {
                // rename the actual file in Google Drive
                await AppMgr.getInstance().driveService?.renameFile(found.fileId ?? '', name);
                const username = getUsernameFromEmail(AppMgr.getInstance().authService.userProfile.email);
                if (username) {
                    // refresh the Google Drive tree
                    fireGoogleUserTree(username);
                }
            } else if (isConnected) {
                // rename the actual file in XRP
                await CommandToXRPMgr.getInstance().renameFile(found.path + '/' + found.name, name);
            }

            EditorMgr.getInstance().RenameEditorTab(originalName, name);

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
        folderLogger.debug(`Create node: ${parentId}, ${parentNode}, ${index}, ${type}`);

        if (parentId === null && parentNode === null) {
            folderLogger.error('Cannot create node: parentId and parentNode are both null');
            setDialogContent(<AlertDialog toggleDialog={toggleDialog} alertMessage={t('select-parent-node')} />);
            toggleDialog();
            return null;
        }

        // Generate a unique ID for the new node
        const newId = uniqueId(parentNode?.data.name || `node`);

        // Create the new node object
        const newNode: FolderItem = {
            id: newId,
            name: type === 'internal' ? t('newFolder') : t('newFile'),
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
                if (isLogin) {
                    await AppMgr.getInstance().driveService?.createFolder(newNode.name,  parentFileId ?? undefined).then((data) => {
                        newNode.fileId = data?.id;
                    });               
                } else if (isConnected) {
                    // create the actual file in XRP
                    await CommandToXRPMgr.getInstance().buildPath(
                        newNode.path + '/' + newNode.name,
                    );
                } 
            } else if (type === 'leaf') {
                if (isLogin) {
                    const mintetype = newNode.name.includes('.py')
                        ? 'text/x-python' : newNode.name.includes('.blocks')
                        ? 'application/json' : 'text/plain';
                    const blob = new Blob([''], { type: mintetype });
                    await AppMgr.getInstance().driveService?.uploadFile(blob, newNode.name, mintetype, parentFileId ?? undefined).then((file) => {
                        if (file) {
                            newNode.fileId = file.id;
                        }
                    });
                } if (isConnected) {
                    // create the actual file in XRP
                    await CommandToXRPMgr.getInstance().uploadFile(
                        newNode.path + '/' + newNode.name,
                        '',
                        true,
                    );
                } 
            }
        }

        return newNode;
    };

    // const onMove = ({ dragIds, dragNodes, parentId, parentNode, index }: { dragIds: string[], dragNodes: NodeApi<FolderItem>[], parentId: string | null, parentNode: NodeApi<FolderItem> | null, index: number }) => {
    //     console.log('Moved nodes:', dragIds, 'to parent:', parentId, 'at index:', index);
    // };{

    const onSelected = (nodes: NodeApi<FolderItem>[]) => {
        const selectedItems: FolderItem[] = [];
        nodes.map((node) => selectedItems.push(node.data));
        if (treeProps.onSelected && selectedItems.length > 0) {
            treeProps.onSelected(selectedItems[0]);
        }
        setSelectedItems(selectedItems);
    };

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

    /**
     * onGoogleLoginSuccess - callback from Google Login component to handle the login logic
     */
    const onGoogleLoginSuccess = async (data: UserProfile) => {
        AppMgr.getInstance().emit(EventType.EVENT_LOGIN_STATUS, LoginStatus.LOGGED_IN);
        setIsLogin(true);

        const username = getUsernameFromEmail(data.email);

        if (username != undefined) {
            if (isConnected) {
                await CommandToXRPMgr.getInstance().buildPath(Constants.GUSERS_FOLDER + username);
            }
        }

        fireGoogleUserTree(username ?? '');
    }

    /**
     * onGoogleLogout - callback from Google Login component to handle the logout logic
     */
    const onGoogleLogout = async () => {
        setIsLogin(false);
        AppMgr.getInstance().authService.logOut().then(() => {
            AppMgr.getInstance().emit(EventType.EVENT_LOGIN_STATUS, LoginStatus.LOGGED_OUT);
        });

        if (!isConnected) {
            AppMgr.getInstance().emit(EventType.EVENT_FILESYS, '{}');
        } {
            await CommandToXRPMgr.getInstance().getOnBoardFSTree()
        }
    }

    return (
        <div className="flex flex-col gap-1">
            {treeProps.isHeader && (
                <div className='flex flex-col items-center p-1 gap-1 bg-mountain-mist-100 dark:bg-mountain-mist-950'>
                    <Login onSuccess={onGoogleLoginSuccess} logoutCallback={onGoogleLogout}/>
                </div>
            )}
            {treeProps.isHeader && (isConnected || isLogin) &&(
                <FolderHeader
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
            <Dialog isOpen={false} toggleDialog={toggleDialog} ref={dialogRef}>
                {dialogContent}
            </Dialog>
        </div>
    );
}

export default FolderTree;
