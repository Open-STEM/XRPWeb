import i18n from '@/utils/i18n';
import { StorageKeys } from '@/utils/localstorage';
import { ModeType } from '@/utils/types';
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
    const modeType = useReadLocalStorage(StorageKeys.MODESETTING);
    return (
        <div className="flex flex-row items-center justify-between bg-mountain-mist-100 p-1 text-sm dark:bg-mountain-mist-800">
            <div className="flex flex-row">
                <span>{i18n.t('FilesystemStorage', { capacity: storageCapacity})}</span>
            </div>
            <div className="flex flex-row gap-1">
                {modeType === ModeType.SYSTEM && (
                    <>
                        <button title={i18n.t('openFolder')} onClick={openFolderCallback}>
                            <FaRegFolderOpen size={'1.5em'} />
                        </button>
                        <button title={i18n.t('closeFolder')} onClick={closeFolderCallback}>
                            <FaRegFolderClosed size={'1.2em'} />
                        </button>
                    </>
                )}
                <button title={i18n.t('newFolder')} onClick={newFolderCallback}>
                    <AiOutlineFolderAdd size={'1.5em'} />
                </button>
                <button title={i18n.t('newFile')} onClick={newFileCallback}>
                    <AiOutlineFileAdd size={'1.4em'} />
                </button>
            </div>
        </div>
    );
}

export default FolderHeader;
