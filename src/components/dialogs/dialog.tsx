import i18n from '@/utils/i18n';
import Button from '@/widgets/button';
import React, { forwardRef } from 'react';

type DialogProps = {
    children: React.ReactNode;
    okBtnLabel: string;
    footter: boolean;
    cancelDialog: () => void;
    okDialog: () => void;
};

const Dialog = forwardRef<HTMLDialogElement, DialogProps>((dlgProps, ref) => {
    return (
        <dialog
            className="rounded-md dark:border dark:border-shark-600 dark:bg-shark-950 shadow-md"
            ref={ref}
            onClick={(e) => {
                if (e.currentTarget === e.target) {
                    dlgProps.cancelDialog();
                }
            }}
        >
            <div className="flex flex-col gap-6 p-6">
                {dlgProps.children}
                {dlgProps.footter && (
                    <div className="flex flex-row items-center justify-end gap-5">
                        <Button label={i18n.t('cancelButton')} onClicked={dlgProps.cancelDialog} />
                        <Button label={dlgProps.okBtnLabel} onClicked={dlgProps.okDialog} />
                    </div>
                )}
            </div>
        </dialog>
    );
});
export default Dialog;
