import i18n from '@/utils/i18n';
import ProgressBar from '@ramonak/react-progress-bar';
import React, { useEffect } from 'react';

/**
 *  SavewToXRPDlg component - Save active document to XRP.
 * @returns none
 */
function SaveToXRPDlg() {
    const [completed, setCompleted] = React.useState(0);

    useEffect(() => {
        setInterval(() => setCompleted(Math.floor(Math.random() * 100) + 1), 2000);
    }, []);

    return (
        <div className="border-shark-800 dark:border-shark-500 dark:bg-shark-950 flex h-auto w-96 flex-col gap-2 p-4">
            <h2>{i18n.t('saveToXRP')}</h2>
            <ProgressBar
                completed={completed}
                bgColor="#0a96ed"
                height="24px"
                isIndeterminate={false}
                animateOnRender={true}
            />
        </div>
    );
}

export default SaveToXRPDlg;
