import AppMgr, { EventType } from '@/managers/appmgr';
import i18n from '@/utils/i18n';
import ProgressBar from 'react-customizable-progressbar';
import React, { useEffect } from 'react';

type SaveProgressDlgProps = {
    title: string;
};

/**
 *  SavewToXRPDlg component - Save active document to XRP.
 * @returns none
 */
function SaveProgressDlg({title}: SaveProgressDlgProps) {
    const [completed, setCompleted] = React.useState<number>(0);

    useEffect(() => {
        AppMgr.getInstance().on(EventType.EVENT_PROGRESS, (percent) => {
            setCompleted(Math.round(parseFloat(percent)));
        });
    }, []);

    return (
        <div className="border rounded-md border-mountain-mist-700 dark:border-shark-500 dark:bg-shark-950 flex items-center h-auto w-96 flex-col gap-4 p-8 shadow-md transition-all">
            <div className='flex flex-col items-center'>
                <h1 className="text-lg font-bold text-mountain-mist-700">{i18n.t(title)}</h1>
            </div>
            <hr className="w-full border-mountain-mist-600" />
            <ProgressBar
                radius={100}
                progress={completed}
                strokeColor="#0a96ed"
                strokeLinecap='square'
                trackStrokeWidth={18}
            >
                <div className='flex items-center justify-center top-0 w-full h-full absolute'>
                    <div className='text-2xl text-mountain-mist-700'>{completed}%</div>
                </div>
            </ProgressBar>
        </div>
    );
}

export default SaveProgressDlg;
