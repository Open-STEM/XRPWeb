// import AppMgr, { EventType } from '@/managers/appmgr';
import { FolderItem } from '@/utils/types';
// import { useEffect, useState } from 'react';
import { Tree, NodeApi, NodeRendererProps } from 'react-arborist';
import { RiArrowDownSFill, RiArrowRightSFill } from 'react-icons/ri';
import { useEffect, useRef, useState } from 'react';
import AppMgr, { EventType } from '@/managers/appmgr';
import { IoLogoPython } from 'react-icons/io5';
import useResizeObserver from 'use-resize-observer';
import ContextMenu from '@/widgets/contextmenu';
import { MenuDataItem } from '@/widgets/menutypes';
import i18n from '@/utils/i18n';
import renameIcon from '@assets/images/rename.svg';
import fileNewIcon from '@assets/images/file_add.svg';
import deleteIcon from '@assets/images/delete_24dp.svg';
import exportIcon from '@assets/images/file_export_24dp.svg';

type TreeProps = {
    treeData: string;
    theme: string;
};

/**
 * Folder component
 * @param treeProps
 * @returns
 */
function Folder(treeProps: TreeProps) {
    const [treeData, setTreeData] = useState();
    const appMgrRef = useRef<AppMgr>();
    const { ref, width, height } = useResizeObserver();

    useEffect(() => {
        // If treeData is passed as a prop, build the tree
        if (treeProps.treeData) {
            const data = JSON.parse(treeProps.treeData);
            setTreeData(data);
        }

        // If treeData is not passed as a prop, get the tree data from the FilesysMgr's publish event
        if (!appMgrRef.current && !treeProps.treeData) {
            appMgrRef.current = AppMgr.getInstance();
            appMgrRef.current.on(EventType.EVENT_FILESYS, (filesysJson: string) => {
                setTreeData(JSON.parse(filesysJson));
            });
        }
    }, [treeProps.treeData]);

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

    function Node({ node, style, dragHandle }: NodeRendererProps<FolderItem>) {
        const Icon = node.data.icon || IoLogoPython;
        return (
            <div
                ref={dragHandle}
                style={style}
                className={`hover:bg-matisse-400 dark:hover:bg-shark-500 flex flex-row items-center ${node.isSelected ? 'bg-shark-300' : ''}`}
                onClick={() => node.isInternal && node.toggle()}
            >
                {node.isLeaf === false &&
                    (node.isOpen ? <RiArrowDownSFill /> : <RiArrowRightSFill />)}
                <span>
                    <Icon />
                </span>
                <span className="mx-1">
                    {node.isEditing ? <Input node={node} /> : node.data.name}
                </span>
            </div>
        );
    }

    const onDelete = () => {};
    const onRename = ({ id }: { id: string }) => {
        console.log(`${id}`);
    };
    // const onCreate = ({ parentId, parentNode, index, type }: { parentId: string | null, parentNode: NodeApi<FolderItem> | null, index: number, type: "internal" | "leaf" }) => {
    //     console.log('Create node:', { parentId, parentNode, index, type });
    //     return null;
    // };
    // const onMove = ({ dragIds, dragNodes, parentId, parentNode, index }: { dragIds: string[], dragNodes: NodeApi<FolderItem>[], parentId: string | null, parentNode: NodeApi<FolderItem> | null, index: number }) => {
    //     console.log('Moved nodes:', dragIds, 'to parent:', parentId, 'at index:', index);
    // };

    const onMenuDelete = () => {};
    const onMenuRename = () => {};
    const onMenuNew = () => {};
    const onMenuExport = () => {};

    const menuItems: MenuDataItem[] = [
        {
            label: i18n.t('delete'),
            iconImage: deleteIcon,
            clicked: onMenuDelete,
        },
        {
            label: i18n.t('rename'),
            iconImage: renameIcon,
            clicked: onMenuRename,
        },
        {
            label: i18n.t('new'),
            iconImage: fileNewIcon,
            clicked: onMenuNew,
        },
        {
            label: i18n.t('exportToPC'),
            iconImage: exportIcon,
            clicked: onMenuExport,
        },
    ];

    return (
        <ContextMenu items={menuItems}>
            <div ref={ref}>
                <Tree
                    data={treeData}
                    width={width}
                    height={height}
                    rowHeight={24}
                    renderCursor={() => 'default'}
                    paddingBottom={32}
                    disableEdit={(data) => data.isReadOnly}
                    disableDrag={true}
                    disableDrop={true}
                    onDelete={onDelete}
                    onRename={onRename}
                    // onMove={onMove}
                    // onCreate={onCreate}
                >
                    {Node}
                </Tree>
            </div>
        </ContextMenu>
    );
}

export default Folder;
