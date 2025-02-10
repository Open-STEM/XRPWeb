import React, { forwardRef } from 'react';

type DialogProps = {
    children: React.ReactNode;
    toggleDialog: () => void;
};

const Dialog = forwardRef<HTMLDialogElement, DialogProps>((dlgProps, ref) => {
    return (
        <dialog
            className="rounded-md shadow-md backdrop:bg-mountain-mist-500 backdrop:opacity-40 dark:border dark:border-shark-600 dark:bg-shark-950 transition-all"
            ref={ref}
            onClick={(e) => {
                if (e.currentTarget === e.target) {
                    dlgProps.toggleDialog();
                }
            }}
        >
            {dlgProps.children}
        </dialog>
    );
});
export default Dialog;
