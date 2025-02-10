import i18n from '@/utils/i18n';
import TabItem from './tab-item';
import TabList from './tab-list';
import FolderTree from './folder-tree';

function Tabs() {
    return (
        <TabList activeTabIndex={0}>
            <TabItem label={i18n.t('myview')}>
                <FolderTree treeData={null} theme="" />
            </TabItem>
            <TabItem label={i18n.t('sysview')}>
                <span>System View</span>
            </TabItem>
        </TabList>
    );
}

export default Tabs;
