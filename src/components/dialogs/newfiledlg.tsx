import i18n from '@/utils/i18n';
import { FileType, FolderItem, ListItem, NewFileData } from '@/utils/types';
import blocklyIcon from '@assets/images/blockly.svg';
import pythonIcon from '@assets/images/python.svg';
import { useEffect, useState } from 'react';
import AppMgr from '@/managers/appmgr';
import DialogFooter from './dialog-footer';

type NewFileProps = {
    submitCallback: (formData: NewFileData) => void;
    toggleDialog: () => void;
};

function NewFileDlg(newFileProps: NewFileProps) {
    const [folder, setFolder] = useState('');
    const [filename, setFilename] = useState('');
    const [filetype, setFileType] = useState<number | null>(null);
    const [folderList, setFolderList] = useState<FolderItem[] | null>(null);

    const fileOptions: ListItem[] = [
        {
            label: i18n.t('blocklyfile'),
            image: blocklyIcon,
        },
        {
            label: i18n.t('pythonfile'),
            image: pythonIcon,
        },
        {
            label: i18n.t('other'),
            image: ''
        }
    ];

    /**
     * get folder list from AppMgr
     */
    useEffect(() => {
        const appMgr = AppMgr.getInstance();
        setFolderList(appMgr.getFolderList());
    }, []);

    /**
     * handleSubmit handler. Gather all data from the form and send back to parent component
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = () => {
        const path = folderList?.filter(node => (node.name === folder));
        const formData: NewFileData = {
            name: filename,
            path: `${path?.[0]?.path}${path?.[0].name}/${filename}`,
            filetype: filetype === 1 ? FileType.BLOCKLY : FileType.PYTHON,
            parentId: path?.[0].id || '',
        };
        newFileProps.submitCallback(formData);
    };

    return (
        <div className="flex flex-col gap-4 items-center border-shark-800 p-8 shadow-md transition-all dark:border-shark-500 dark:bg-shark-950">
            <div className='flex flex-col items-center w-[80%]'>
            <h1 className="text-lg font-bold text-mountain-mist-700">{i18n.t('newFile')}</h1>
            <p className='text-sm text-mountain-mist-700'>{i18n.t('chooseNewFile')}</p>
            </div>
            <hr className="w-full border-mountain-mist-600" />
            <form id="fileOptionId" className="flex flex-col gap-2 w-full">
                <label className='text-sm text-mountain-mist-700'>{i18n.t('destFolder')}</label>
                <div className="flex flex-row items-center gap-2">
                    <select
                        id="usersId"
                        className="dark:text-white block w-full rounded border border-s-2 border-shark-300 border-s-curious-blue-500 bg-mountain-mist-100 p-2.5 text-sm text-mountain-mist-700 focus:border-mountain-mist-500 focus:ring-curious-blue-500 dark:border-shark-600 dark:border-s-shark-500 dark:bg-shark-500 dark:text-mountain-mist-200 dark:placeholder-mountain-mist-400 dark:focus:border-matisse-500 dark:focus:ring-shark-300"
                        onChange={(e) => {
                            setFolder(e.target.value);
                        }}
                    >
                        <option defaultValue={i18n.t('chooseFolder')}>{i18n.t('chooseFolder')}</option>
                        {folderList && folderList.map((option) => (
                            <option key={option.name} value={option.name}>
                                {option.name}
                            </option>
                        ))}
                    </select>
                </div>
                <label className='text-sm text-mountain-mist-700'>{i18n.t('filename')}</label>
                <div className="flex flex-row items-center gap-2">
                    <input
                        className="w-full rounded border border-shark-300 p-2 text-sm text-mountain-mist-700 dark:border-shark-600 dark:bg-shark-500 dark:text-mountain-mist-200 dark:placeholder-mountain-mist-400"
                        id="filenameId"
                        type="text"
                        placeholder={i18n.t('enterFilename')}
                        required
                        minLength={2}
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                    />
                </div>
                <label className='text-sm text-mountain-mist-700' htmlFor="filesId">
                    {i18n.t('fileType')}
                </label>
                <select
                    id="filesId"
                    className="dark:text-white block w-auto rounded border border-s-2 border-shark-300 border-s-curious-blue-500 bg-mountain-mist-100 p-2.5 text-sm text-mountain-mist-700 focus:border-mountain-mist-500 focus:ring-curious-blue-500 dark:border-shark-600 dark:border-s-shark-500 dark:bg-shark-500 dark:text-mountain-mist-200 dark:placeholder-mountain-mist-400 dark:focus:border-matisse-500 dark:focus:ring-shark-300"
                    onChange={(e) => setFileType(e.target.selectedIndex)}
                >
                    <option defaultValue={i18n.t('files')}>{i18n.t('files')}</option>
                    {fileOptions.map((option) => (
                        <option key={option.label} value={option.label}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </form>
            <hr className="w-full border-mountain-mist-600" />
            <DialogFooter btnAcceptLabel={i18n.t('submit')} btnAcceptCallback={handleSubmit} btnCancelCallback={newFileProps.toggleDialog} />
        </div>
    );
}

export default NewFileDlg;
