import AppMgr, { EventType } from '@/managers/appmgr';
import { FileData, FolderItem } from '@/utils/types';
import { useEffect, useState } from 'react';
import FolderTree from '../folder-tree';
import DialogFooter from './dialog-footer';
import { CommandToXRPMgr } from '@/managers/commandstoxrpmgr';
import { useTranslation } from 'react-i18next';
import { Constants } from '@/utils/constants';
import { fireGoogleUserTree, getUsernameFromEmail } from '@/utils/google-utils';

type UploadFileDlgProps = {
    files: FileData[];
    toggleDialog: () => void;
};

function UploadFileDlg({ files, toggleDialog }: UploadFileDlgProps) {
    const { t } = useTranslation();
    const [folderItem, setFolderItem] = useState<FolderItem[] | null>(null);
    const [fileList, setFileList] = useState<FileData[] | null >(null);
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [gFolderId, setGFolderId] = useState<string>('');

    /**
     * handleFileUpload - upload the selected files to the selected folder
     */
    const handleFileUpload = async () => {
        toggleDialog();
        if (!fileList) return;

        const appMgr = AppMgr.getInstance();
        const loginNow = appMgr.authService.isLogin;
        const connectedNow = appMgr.getConnection()?.isConnected() ?? false;

        appMgr.emit(EventType.EVENT_SHOWPROGRESS, Constants.SHOW_PROGRESS);

        try {
            for (const file of fileList) {
                const path = selectedFolder + '/' + file.name;
                if (loginNow) {
                    const minetype = file.name.includes('.py')
                        ? 'text/x-python'
                        : file.name.includes('.blocks')
                          ? 'application/json'
                          : 'text/plain';
                    const blob = new Blob([file.content], { type: minetype });

                    await appMgr.driveService.uploadFile(blob, file.name, minetype, gFolderId);
                } else if (connectedNow) {
                    await CommandToXRPMgr.getInstance().uploadFile(path, file.content, true);
                }
            }

            // Refresh the tree for the destination that received the upload.
            // When logged in to Google Drive the sidebar shows the Drive tree, so
            // refresh Drive — not the XRP tree (which would be ignored anyway).
            if (loginNow) {
                const username = getUsernameFromEmail(appMgr.authService.userProfile.email);
                await fireGoogleUserTree(username ?? '');
            } else if (connectedNow) {
                await CommandToXRPMgr.getInstance().getOnBoardFSTree();
            }
        } finally {
            appMgr.emit(EventType.EVENT_UPLOAD_DONE, '');
        }
    };

    /**
     * handleFolderSelection - callback function to handle the selected folder
     * @param selectedItem 
     */
    const handleFolderSelection = (selectedItem: FolderItem) => {
        const path = selectedItem.path === '/' ? `` : selectedItem.path;
        setSelectedFolder(path);
        setGFolderId(selectedItem.id);
    }

    useEffect(() => {
        setFileList(files);
        setFolderItem(AppMgr.getInstance().getFolderList());
    }, [files]);

    return (
        <div className="border rounded-md border-mountain-mist-700 dark:border-shark-500 dark:bg-shark-950 flex h-auto w-96 flex-col gap-2 p-8 shadow-md transition-all">
            <div className='flex flex-col items-center'>
                <h1 className="text-lg font-bold text-mountain-mist-700 dark:text-mountain-mist-300">{t('uploadFiles')}</h1>
            </div>
            <hr className="w-full border-mountain-mist-600 dark:border-mountain-mist-200" />
            <div className='h-48 w-full overflow-y-auto border border-shark-300 dark:border-shark-600'>
                <FolderTree treeData={JSON.stringify(folderItem)} theme="" onSelected={handleFolderSelection} />
            </div>
            <label className="text-mountain-mist-700 dark:text-mountain-mist-300">{t('destFolder')}: {selectedFolder}</label>
            <label className="text-mountain-mist-700 dark:text-mountain-mist-300">{t('filesToUpload')}: {fileList?.length}</label>
            <ul className='flex flex-col gap-2'>
                {fileList?.map((file) => (
                    <li key={file.name} className="text-mountain-mist-700 dark:text-mountain-mist-300 hover:text-neutral-100">
                        <span>{file.name}</span>
                    </li>
                ))}
            </ul>
            <hr className="w-full border-mountain-mist-600 dark:border-mountain-mist-200" />
            <DialogFooter btnCancelCallback={toggleDialog} btnAcceptLabel={t('upload')} btnAcceptCallback={handleFileUpload}/>
        </div>    
    )
}

export default UploadFileDlg;
