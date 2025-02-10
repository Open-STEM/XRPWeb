import FolderTree from '@/components/folder-tree';
import DialogFooter from './dialog-footer';
import i18n from '@/utils/i18n';

type FileSaveAsProps = {
    treeData: string;
    toggleDialog: () => void;
};

/**
 * FileSaveAs Dialog Content
 * @param fileSaveAsProps
 * @returns
 */
function FileSaveAsDialg(fileSaveAsProps: FileSaveAsProps) {

    /**
     * handleFileSave - collects the selected file and save to XRP
     */
    const handleFileSave = () => {
        fileSaveAsProps.toggleDialog();
    };

    return (
        <div className="border-shark-800 dark:border-shark-500 dark:bg-shark-950 flex h-auto w-96 flex-col gap-1 p-8 shadow-md transition-all">
            <FolderTree treeData={fileSaveAsProps.treeData} theme="" />
            <input className="bg-slate-200" placeholder="Filename" />
            <span>Final Path:</span>
            <DialogFooter btnCancelCallback={fileSaveAsProps.toggleDialog} btnAcceptLabel={i18n.t('save')} btnAcceptCallback={handleFileSave}/>
        </div>
    );
}

export default FileSaveAsDialg;
