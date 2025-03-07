import { sanitizeForId } from '@/utils/stringUtils';
import { ReactNode } from 'react';

export interface TabItemProps {
    label: string;
    children: ReactNode;
}

interface TabItemPropsAnimated extends TabItemProps {
    isActive?: boolean;
}

function TabItem({ label, children, isActive }: TabItemPropsAnimated) {
    console.log('FolderTabItem: ', children);
    return (
        <div
            className={`${isActive ? 'block' : 'hidden'}`}
            style={{height: '100vh'}}
            role="tabpanel"
            aria-labelledby={`tab-${sanitizeForId(label)}`}
            id={`pane-${sanitizeForId(label)}`}
        >
            {children}
        </div>
    );
}

export default TabItem;
