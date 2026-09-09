import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ProgressBar from 'react-customizable-progressbar';
import { FaArrowRight } from 'react-icons/fa';
import Button from '@/widgets/button';
import AppMgr from '@/managers/appmgr';
import { CommandToXRPMgr } from '@/managers/commandstoxrpmgr';
import { FolderItem } from '@/utils/types';
import FolderTree from '../folder-tree';
import DialogFooter from './dialog-footer';
import { fireGoogleUserTree, getUsernameFromEmail } from '@/utils/google-utils';

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
    const [isCopying, setIsCopying] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [progressItem, setProgressItem] = useState<string>('');
    const [gdriveSelectedFolder, setGDriveFolder] = useState<FolderItem[] | null>(null);
    const [xrpRobotSelectedFolder, setXrpRobotFolder] = useState<FolderItem[] | null>(null);

    useEffect(() => {
        // Get the XRP Robot's file list
        CommandToXRPMgr.getInstance()
            .getOnBoardFSTree(false)
            .then((fileList) => {
                if (fileList) {
                    const folderTree = JSON.parse(fileList);
                    setXrpRobotFileList(folderTree);
                }
            });

        // Get the google drive's file list
        setGDriveFileList(AppMgr.getInstance().getFolderList());
    }, []);

    /*
     * Begin copy process
     */
    const beginCopy = async () => {
        console.log('beginCopy');
        setIsCopying(true);
        // begin the copying process
        if (xrpRobotSelectedFolder === null || gdriveSelectedFolder === null) {
            setIsCopying(false);
            return;
        }
        setIsCopying(true);
        const countItems = (items: FolderItem[]): number => {
            let count = 0;
            for (const item of items) {
                count += 1;
                if (item.children) {
                    count += countItems(item.children);
                }
            }
            return count;
        };
        const totalItems = countItems(xrpRobotSelectedFolder || []);
        let completedItems = 0;
        setProgress(0);

        // create a resursive function to process the folder items
        const processFolderItems = async (folderItems: FolderItem[], parentFolderId: string) => {
            for (const folderItem of folderItems) {
                setProgressItem(folderItem.name);

                if (folderItem.children) {
                    // create the directory in Google Drive
                    const folder = await AppMgr.getInstance().driveService.createFolder(
                        folderItem.name,
                        parentFolderId,
                    );
                    completedItems++;
                    setProgress(Math.round((completedItems / Math.max(totalItems, 1)) * 100));
                    await processFolderItems(folderItem.children || [], folder?.id || '');
                } else {
                    // for each folder item, we need to read the content from the XRP Robot and save it to Google Drive
                    const filePath =
                        folderItem.path === '/'
                            ? folderItem.path + folderItem.name
                            : folderItem.path + '/' + folderItem.name;
                    const content = await CommandToXRPMgr.getInstance().getFileContents(filePath);
                    const data: string = new TextDecoder().decode(new Uint8Array(content));
                    const minetype =
                        folderItem.name.split('.').pop() === 'py' ? 'text/x-python' : 'text/plain';
                    const blob = new Blob([data], { type: minetype });
                    await AppMgr.getInstance().driveService.upsertFileToGoogleDrive(
                        blob,
                        folderItem.name,
                        minetype,
                        undefined,
                        parentFolderId,
                    );
                    completedItems++;
                    setProgress(Math.round((completedItems / Math.max(totalItems, 1)) * 100));
                }
            }
        };

        await processFolderItems(xrpRobotSelectedFolder, gdriveSelectedFolder[0].id ?? '');
        setIsCopying(false);
        // update the Google Drive folder list
        fireGoogleUserTree(
            getUsernameFromEmail(AppMgr.getInstance().authService.userProfile.email) ?? '',
        );
        setTimeout(() => {
            toggleDialog();
        }, 1000);
    };

    /**
     * Handle selected folder change
     */
    const handleXrpRobotFolderSelect = (selectedItem: FolderItem[]) => {
        console.log('XRP Robot', selectedItem);
        setXrpRobotFolder(selectedItem);
    };

    function handleGDriveFolderSelect(selectedItem: FolderItem[]): void {
        console.log('Google Drive', selectedItem);
        setGDriveFolder(selectedItem);
    }

    return (
        <div className="flex flex-col items-center gap-4 rounded-md border border-mountain-mist-700 p-8 shadow-md transition-all dark:border-shark-500 dark:bg-shark-950">
            <div className="flex w-[90%] flex-col items-center">
                <h1 className="text-lg font-bold text-mountain-mist-700 dark:text-mountain-mist-300">
                    {t('copyfiles.title')}
                </h1>
                <p className="text-sm font-normal text-mountain-mist-700 dark:text-mountain-mist-300">
                    {t('copyfiles.description')}
                </p>
            </div>
            <hr className="w-full border-mountain-mist-600" />
            {/* Three-Column Grid Layout */}
            <div className="grid min-h-0 flex-1 grid-cols-8 gap-4">
                {/* XRP Robot Files Column */}
                <div className="col-span-3 w-full flex-col items-center border-2 border-mountain-mist-200 dark:border-shark-500">
                    <div className="flex items-center justify-center bg-mountain-mist-200 dark:bg-shark-800">
                        <span className="text-center font-bold text-mountain-mist-700 dark:text-mountain-mist-300">
                            {t('copyfiles.xrprobot')}
                        </span>
                    </div>
                    <div>
                        <FolderTree
                            treeData={JSON.stringify(xrpRobotFileList)}
                            theme=""
                            onSelected={handleXrpRobotFolderSelect}
                        />
                    </div>
                </div>
                {/* Move Icon Column */}
                <div className="col-span-2 flex flex-col items-center justify-center gap-4">
                    <div
                        className={`${isCopying ? 'flex' : 'hidden'} text-sm text-mountain-mist-700 dark:text-mountain-mist-300`}
                    >
                        <ProgressBar
                            radius={100}
                            progress={progress}
                            strokeColor="#0a96ed"
                            strokeLinecap="square"
                            trackStrokeWidth={18}
                        />
                    </div>
                    <div
                        className={`${isCopying ? 'flex' : 'hidden'} flex items-center gap-2 text-sm text-mountain-mist-700 dark:text-mountain-mist-300`}
                    >
                        <span>Copying:</span>
                        <span className="text-mountain-mist-700 dark:text-mountain-mist-300">
                            {progressItem}
                        </span>
                    </div>
                    <Button
                        disabled={isCopying}
                        tooltip={t('copyfiles.copyTooltip')}
                        onClicked={beginCopy}
                    >
                        {t('copyfiles.copy')}
                        <FaArrowRight />
                    </Button>
                </div>
                {/* Google Drive Column */}
                <div className="col-span-3 w-full border-2 border-mountain-mist-200 dark:border-shark-500">
                    <div className="flex items-center justify-center bg-mountain-mist-200 dark:bg-shark-800">
                        <span className="text-center font-bold text-mountain-mist-700 dark:text-mountain-mist-300">
                            {t('copyfiles.gdrive')}
                        </span>
                    </div>
                    <div>
                        <FolderTree
                            treeData={JSON.stringify(gdriveFileList)}
                            theme=""
                            onSelected={handleGDriveFolderSelect}
                        />
                    </div>
                </div>
            </div>
            {/* Dialog Footer */}
            <DialogFooter
                hideCancelBtn={true}
                disabledAccept={isCopying}
                btnAcceptLabel={t('copyfiles.close')}
                btnAcceptCallback={toggleDialog}
                btnCancelCallback={toggleDialog}
            />
        </div>
    );
}

export default CopyFileDlg;
