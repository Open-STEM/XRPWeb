import FolderTree from '@/components/folder-tree';
import DialogFooter from './dialog-footer';
import { FileType, FolderItem, NewFileData } from '@/utils/types';
import { useEffect, useState } from 'react';
import { useReadLocalStorage } from 'usehooks-ts';
import { StorageKeys } from '@/utils/localstorage';
import EditorMgr from '@/managers/editormgr';
import { useTranslation } from 'react-i18next';

type FileSaveAsProps = {
    treeData: string;
    saveCallback: (fileData: NewFileData) => void;
    toggleDialog: () => void;
};

/**
 * FileSaveAs Dialog Content
 * @param fileSaveAsProps
 * @returns
 */
function FileSaveAsDialg(fileSaveAsProps: FileSaveAsProps) {
    const { t } = useTranslation();
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const activeTab = useReadLocalStorage<string>(StorageKeys.ACTIVETAB);
    const [filename, setFilename] = useState<string>('');

    /**
     * handleFileSave - collects the selected file and save to XRP
     */
    const handleFileSave = () => {
        const fileData: NewFileData = {
            name: filename,
            path: selectedFolder,
            filetype: activeTab?.includes('.blocks') ? FileType.BLOCKLY : FileType.PYTHON,
            parentId: ''
        }
        fileSaveAsProps.saveCallback(fileData);
    };

    /**
     * handleFolderSelection - callback function to handle the selected folder
     * @param selectedItem
     */
    const handleFolderSelection = (selectedItem: FolderItem) => {
        const path = selectedItem.path === '/' ? `` : selectedItem.path;
        setSelectedFolder(`${path}/${selectedItem.name}`);
    };

    /**
     * handleFilenameInput
     * @param e 
     */
    const handleFilenameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilename(e.target.value);
    };

    useEffect(() => {
        if (activeTab !== null) {
            setFilename(activeTab);
            const session = EditorMgr.getInstance().getEditorSession(activeTab);
            if (session) {
                setSelectedFolder('/' + session.path.split('/')[1]);
            }
        }
    }, [activeTab]);

    return (
        <div className="flex h-auto w-96 flex-col gap-2 rounded-md border border-mountain-mist-700 p-8 shadow-md transition-all dark:border-shark-500 dark:bg-shark-950">
            <div className="flex flex-col items-center">
                <h1 className="text-lg font-bold text-mountain-mist-700">{t('saveFileAs')}</h1>
                <p className="text-sm text-mountain-mist-700">{t('choose-dest-file')}</p>
            </div>
            <hr className="w-full border-mountain-mist-600" />
            <label className="text-mountain-mist-700">
                {t('destFolder')}: {selectedFolder}
            </label>
            <FolderTree
                treeData={fileSaveAsProps.treeData}
                theme=""
                onSelected={handleFolderSelection}
            />
            <label className="text-sm text-mountain-mist-700">{t('filename')}</label>
            <input
                className="w-full border p-2 rounded border-shark-300 text-md text-mountain-mist-700 dark:border-shark-600 dark:bg-shark-500 dark:text-mountain-mist-200 dark:placeholder-mountain-mist-400"
                type="text"
                placeholder={t('enterFilename')}
                value={filename}
                required
                onChange={handleFilenameInput}
                minLength={2}
            />
            <label className="text-mountain-mist-700">
                {t('final-path')}
                {selectedFolder}/{filename}
            </label>
            <hr className="w-full border-mountain-mist-600" />
            <DialogFooter
                btnCancelCallback={fileSaveAsProps.toggleDialog}
                btnAcceptLabel={t('save')}
                btnAcceptCallback={handleFileSave}
            />
        </div>
    );
}

export default FileSaveAsDialg;
