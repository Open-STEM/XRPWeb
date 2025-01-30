import Folder from '@/components/folder';

type FileSaveAsProps = {
    treeData: string;
};

/**
 * FileSaveAs Dialog Content
 * @param fileSaveAsProps
 * @returns
 */
function FileSaveAsDialg(fileSaveAsProps: FileSaveAsProps) {
    return (
        <div className="border-shark-800 dark:border-shark-500 dark:bg-shark-950 flex h-auto w-96 flex-col gap-1 border p-8 shadow-md transition-all">
            <Folder treeData={fileSaveAsProps.treeData} theme="" />
            <input className="bg-slate-200" placeholder="Filename" />
            <span>Final Path:</span>
        </div>
    );
}

export default FileSaveAsDialg;
