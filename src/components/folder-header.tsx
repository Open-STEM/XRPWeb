import AppMgr, { EventType } from '@/managers/appmgr';
import { StorageKeys } from '@/utils/localstorage';
import { ModeType } from '@/utils/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AiOutlineFileAdd } from "react-icons/ai";
import { AiOutlineFolderAdd } from "react-icons/ai";
import { FaRegFolderOpen } from "react-icons/fa";
import { FaRegFolderClosed } from "react-icons/fa6";
import { useReadLocalStorage } from 'usehooks-ts';

interface FolderHeaderProps {
    storageCapacity: string;
    openFolderCallback: () => void;
    closeFolderCallback: () => void;
    newFolderCallback: () => void;
    newFileCallback: () => void;
}

function FolderHeader({ storageCapacity, openFolderCallback, closeFolderCallback, newFolderCallback, newFileCallback }: FolderHeaderProps) {
    const { t } = useTranslation();
    const modeType = useReadLocalStorage(StorageKeys.MODESETTING);
    const [isRunning, setIsRunning] = useState<boolean>(false);

    useEffect(() => {
        const appMgr = AppMgr.getInstance();

        appMgr.on(EventType.EVENT_ISRUNNING, (running: string) => {
            if (running === 'running') {
                setIsRunning(true);
            } else if (running === 'stopped') {
                setIsRunning(false);
            }
        });
    }, []);
    
    return (
        <div className="flex flex-row items-center justify-between bg-mountain-mist-100 p-1 text-sm dark:bg-mountain-mist-800">
            <div className="flex flex-row">
                <span>{t('FilesystemStorage', { capacity: storageCapacity})}</span>
            </div>
            <div className="flex flex-row gap-1">
                {modeType === ModeType.SYSTEM && (
                    <>
                        <button title={t('openFolder')} onClick={openFolderCallback} disabled={isRunning}>
                            <FaRegFolderOpen className={`${isRunning ? 'opacity-50' : 'opacity-100'}`} size={'1.5em'} />
                        </button>
                        <button title={t('closeFolder')} onClick={closeFolderCallback} disabled={isRunning}>
                            <FaRegFolderClosed className={`${isRunning ? 'opacity-50' : 'opacity-100'}`} size={'1.2em'} />
                        </button>
                    </>
                )}
                <button title={t('newFolder')} onClick={newFolderCallback} disabled={isRunning}>
                    <AiOutlineFolderAdd className={`${isRunning ? 'opacity-50' : 'opacity-100'}`} size={'1.5em'} />
                </button>
                <button title={t('newFile')} className={`${isRunning ? 'opacity-50' : 'opacity-100'}`} onClick={newFileCallback} disabled={isRunning}>
                    <AiOutlineFileAdd size={'1.4em'} />
                </button>
            </div>
        </div>
    );
}

export default FolderHeader;
