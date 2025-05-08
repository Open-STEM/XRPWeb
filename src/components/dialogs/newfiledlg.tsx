import i18n from '@/utils/i18n';
import { FileType, FolderItem, ListItem, NewFileData } from '@/utils/types';
import { useEffect, useState } from 'react';
import AppMgr from '@/managers/appmgr';
import DialogFooter from './dialog-footer';
import EditorMgr from '@/managers/editormgr';
import FolderTree from '../folder-tree';

type NewFileProps = {
    submitCallback: (formData: NewFileData) => void;
    toggleDialog: () => void;
};

function NewFileDlg(newFileProps: NewFileProps) {
    const [isFileExists, setIsFileExists] = useState(false);
    const [isOkayToSubmit, setIsOkayToSubmit] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState('');
    const [filename, setFilename] = useState('');
    const [filetype, setFileType] = useState<number | null>(null);
    const [folderList, setFolderList] = useState<FolderItem[] | null>(null);

    const fileOptions: ListItem[] = [
        {
            label: i18n.t('blocklyfile'),
        },
        {
            label: i18n.t('pythonfile'),
        },
        {
            label: i18n.t('other'),
        },
    ];

    /**
     * get folder list from AppMgr
     */
    useEffect(() => {
        const appMgr = AppMgr.getInstance();
        setFolderList(appMgr.getFolderList());
    }, []);

    /**
     * handleFilenameInput - handles the filename input from user
     * @param e 
     * @returns 
     */
    const handleFilenameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilename(e.target.value);
        const filename = e.target.value + (filetype === 1 ? '.blocks' : '.py');
        if (EditorMgr.getInstance().hasEditorSession(filename)) {
            setIsFileExists(true);
            setIsOkayToSubmit(false);
            return;
        } else {
            setIsFileExists(false);
            setIsOkayToSubmit(true);
        }
    };

    /**
     * findItemInFolderList - recursive function to find the folder item in the folder list
     * @param folderList 
     * @param folder 
     * @returns folder item or null
     */
    const findItemInFolderList = (folderList: FolderItem[], folder: string): FolderItem | null => {
        for (const item of folderList) {
            if (item.name === folder) {
                return item;
            }
            if (item.children) {
                const foundItem = findItemInFolderList(item.children, folder);
                if (foundItem) {
                    return foundItem;
                }
            }
        }
        return null;
    }
    /**
     * handleSubmit handler. Gather all data from the form and send back to parent component
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = () => {
        const folders = selectedFolder.split('/');
        const folder = folders[folders.length - 1];
        const parentId = findItemInFolderList(folderList || [], folder)?.id || '';
        const fileExt = filetype === 1 ? '.blocks' : '.py';
        const formData: NewFileData = {
            name: filename,
            path: `${selectedFolder}/${filename}${fileExt}`,
            filetype: filetype === 1 ? FileType.BLOCKLY : FileType.PYTHON,
            parentId: parentId || '',
        };
        newFileProps.submitCallback(formData);
    };

    /**
     * handleFolderSelection - callback function to handle the selected folder
     * @param selectedItem
     */
    const handleFolderSelection = (selectedItem: FolderItem) => {
        const path = selectedItem.path === '/' ? `` : selectedItem.path;
        setSelectedFolder(`${path}/${selectedItem.name}`);
    };

    return (
        <div className="flex flex-col items-center gap-4 rounded-md border border-mountain-mist-700 p-8 shadow-md transition-all dark:border-shark-500 dark:bg-shark-950">
            <div className="flex w-[90%] flex-col items-center">
                <h1 className="text-lg font-bold text-mountain-mist-700">{i18n.t('newFile')}</h1>
                <p className="text-sm text-mountain-mist-700">{i18n.t('chooseNewFile')}</p>
            </div>
            <hr className="w-full border-mountain-mist-600" />
            <form id="fileOptionId" className="flex w-full flex-col gap-2">
                <label className="text-sm text-mountain-mist-700">{i18n.t('destFolder')}</label>
                <FolderTree
                    treeData={JSON.stringify(folderList)}
                    theme=""
                    onSelected={handleFolderSelection}
                />
                <label className="text-sm text-mountain-mist-700" htmlFor="filesId">
                    {i18n.t('fileType')}
                </label>
                <select
                    id="filesId"
                    className="dark:text-white block w-auto rounded border border-s-2 border-shark-300 border-s-curious-blue-500 bg-mountain-mist-100 p-2.5 text-sm text-mountain-mist-700 focus:border-mountain-mist-500 focus:ring-curious-blue-500 dark:border-shark-600 dark:border-s-shark-500 dark:bg-shark-500 dark:text-mountain-mist-200 dark:placeholder-mountain-mist-400 dark:focus:border-matisse-500 dark:focus:ring-shark-300"
                    onChange={(e) => {
                        setFileType(e.target.selectedIndex);
                    }}
                    disabled={selectedFolder === ''}
                >
                    <option defaultValue={i18n.t('files')}>{i18n.t('files')}</option>
                    {fileOptions.map((option) => (
                        <option
                            key={option.label}
                            value={option.label}
                            className="flex flex-row items-center gap-2"
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
                <label className="text-sm text-mountain-mist-700">{i18n.t('filename')}</label>
                <div className="flex flex-col items-center gap-1">
                    <input
                        className={`w-full rounded border ${isFileExists ? 'border-cinnabar-800' : 'border-shark-300 dark:border-shark-600'} p-2 text-sm text-mountain-mist-700 dark:bg-shark-500 dark:text-mountain-mist-200 dark:placeholder-mountain-mist-400`}
                        id="filenameId"
                        type="text"
                        placeholder={i18n.t('enterFilename')}
                        required
                        minLength={2}
                        value={filename}
                        onChange={handleFilenameInput}
                        disabled={filetype === null || selectedFolder === ''}
                    />
                    {isFileExists && (
                        <span className="text-sm text-cinnabar-800">{i18n.t('fileExists')}</span>
                    )}
                </div>
                <label className="text-mountain-mist-700 text-sm">
                {i18n.t('final-path')}
                {selectedFolder}/{filename}{filetype === 1 ? '.blocks' : '.py'} 
            </label>

            </form>
            <hr className="w-full border-mountain-mist-600" />
            <DialogFooter
                disabledAccept={!isOkayToSubmit}
                btnAcceptLabel={i18n.t('submitBtn')}
                btnAcceptCallback={handleSubmit}
                btnCancelCallback={newFileProps.toggleDialog}
            />
        </div>
    );
}

export default NewFileDlg;
