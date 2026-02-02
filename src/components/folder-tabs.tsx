import TabItem from './tab-item';
import TabList from './tab-list';
import FolderTree from './folder-tree';
import { useTranslation } from 'react-i18next';
import AppMgr, { EventType } from '@/managers/appmgr';
import { FolderItem } from '@/utils/types';
import { useState, useEffect } from 'react';

function Tabs() {
    const { t } = useTranslation();
    const [currentFolderTree, setCurrentFolderTree] = useState<FolderItem[] | null>(null);

    useEffect(() => {
        // Function to update the folder tree based on the current user mode
        const updateFolderTree = () => {
            setCurrentFolderTree(AppMgr.getInstance().getFilteredFolderList());
            // TODO: If UserMode is GOOGLE_USER, need to trigger google drive loading
        };

        // Initial load of the folder tree
        updateFolderTree();

        // Listen for user mode changes
        AppMgr.getInstance().on(EventType.EVENT_USERMODE_CHANGED, updateFolderTree);

        // Cleanup function
        return () => {
            AppMgr.getInstance().off(EventType.EVENT_USERMODE_CHANGED);
        };
    }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

    return (
        <TabList activeTabIndex={0}>
            <TabItem label={t('myview')}>
                <FolderTree treeData={currentFolderTree ? JSON.stringify(currentFolderTree) : null} theme="" />
            </TabItem>
            <TabItem label={t('sysview')}>
                {/* This will now display the filtered folder tree instead of a static span */}
                <FolderTree treeData={currentFolderTree ? JSON.stringify(currentFolderTree) : null} theme="" />
            </TabItem>
        </TabList>
    );
}

export default Tabs;
