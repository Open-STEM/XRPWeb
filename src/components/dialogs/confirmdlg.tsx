import i18n from '@/utils/i18n'
import DialogFooter from '@/components/dialogs/dialog-footer';

type ConfirmationProps = {
    confirmationMessage: string;
    acceptCallback: () => void;
    toggleDialog: () => void;
}

function ConfirmationDlg({confirmationMessage, acceptCallback, toggleDialog}: ConfirmationProps) {
  return (
    <div className="flex h-auto w-96 flex-col gap-2 rounded-md border border-mountain-mist-700 p-8 shadow-md transition-all dark:border-shark-500 dark:bg-shark-950">
    <div className="flex flex-col items-center">
        <h1 className="text-lg font-bold text-mountain-mist-700">
            {i18n.t('confirmTitle')}
        </h1>
    </div>
    <hr className="w-full border-mountain-mist-600" />
    <span className='text-md text-mountain-mist-900'>{confirmationMessage}</span>
    <hr className="w-full border-mountain-mist-600" />
    <DialogFooter
        hideCancelBtn={false}
        disabledAccept={false}
        btnAcceptLabel={i18n.t('okButton')}
        btnCancelCallback={toggleDialog}
        btnAcceptCallback={acceptCallback}
    />
</div>
)
}

export default ConfirmationDlg