import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/widgets/button';
import AppMgr from '@/managers/appmgr';
import { CommandToXRPMgr } from '@/managers/commandstoxrpmgr';
import { FolderItem } from '@/utils/types';
import FolderTree from '../folder-tree';
import { Constants } from '@/utils/constants';

type CopyFileDlgProps = {
    toggleDialog: () => void;
};

/**
 * CopyFileDlg component for displaying copy file progress.
 * @param toggleDialog Function to toggle the visibility of the dialog
 * @returns CopyFileDlg component
 */
function CopyFileDlg({ toggleDialog }: CopyFileDlgProps) {
    const { t } = useTranslation();

    const [xrpRobotFileList, setXrpRobotFileList] = useState<FolderItem[] | null>(null);
    const [gdriveFileList, setGDriveFileList] = useState<FolderItem[] | null>(null);

    useEffect(() => {
        // Get the XRP Robot's file list
        CommandToXRPMgr.getInstance()
            .getOnBoardFSTree(false)
            .then((fileList) => {
                const folderTree = JSON.parse(fileList);
                const fileListItems: FolderItem[] = folderTree
                    .at(0)
                    .children.filter(
                        (item: FolderItem) =>
                            item.name !== 'lib' &&
                            item.name !== 'XRPExamples' &&
                            item.name !== 'gusers' &&
                            item.name !== 'trash',
                    );
                setXrpRobotFileList(fileListItems);
            });

        // Get the google drive's file list
        setGDriveFileList(AppMgr.getInstance().getFolderList());
    }, []);

    /*
     * Begin copy process
     */
    const beginCopy = async () => {};

    /**
     * Handle selected folder change
     */
    const handleXrpRobotFolderSelect = (selectedItem: FolderItem) => {
        console.log(selectedItem);
    };

    function handleGDriveFolderSelect(selectedItem: FolderItem): void {
        console.log(selectedItem);
    }

    return (
        <div className="flex flex-col items-center gap-4 rounded-md border border-mountain-mist-700 p-8 shadow-md transition-all dark:border-shark-500 dark:bg-shark-950">
            <div className="flex w-[90%] flex-col items-center">
                <h1 className="text-lg font-bold text-mountain-mist-700 dark:text-mountain-mist-300">
                    {t('copyfile.title')}
                </h1>
            </div>
            <hr className="w-full border-mountain-mist-600" />
            {/* Three-Column Grid Layout */}
            <div className="grid min-h-0 flex-1 grid-cols-8 gap-4">
                {/* XRP Robot Files Column */}
                <div className="col-span-3 w-full border-2 border-mountain-mist-400 dark:border-shark-500">
                    <FolderTree
                        treeData={JSON.stringify(xrpRobotFileList)}
                        theme=""
                        onSelected={handleXrpRobotFolderSelect}
                    />
                </div>
                {/* Move Icon Column */}
                <div className="col-span-2">
                    <span>Test Button</span>
                </div>
                {/* Google Drive Column */}
                <div className="col-span-3 w-full border-2 border-mountain-mist-400 dark:border-shark-500">
                    <FolderTree
                        treeData={JSON.stringify(gdriveFileList)}
                        theme=""
                        onSelected={handleGDriveFolderSelect}
                    />
                </div>
            </div>
            {/* Dialog Footer */}
            <div className="flex justify-end gap-2">
                <Button onClicked={toggleDialog}>{t('close')}</Button>
            </div>
        </div>
    );
}

export default CopyFileDlg;
