import i18n from '@/utils/i18n';
import Button from '@/widgets/button';

type DialogFooterProps = {
    hideCancelBtn?: boolean;
    disabledAccept?: boolean;
    btnAcceptLabel: string;
    btnAcceptCallback: () => void;
    btnCancelCallback: () => void;
};

function DialogFooter({
    hideCancelBtn,
    disabledAccept,
    btnAcceptLabel,
    btnAcceptCallback,
    btnCancelCallback,
}: DialogFooterProps) {
    return (
        <div className="flex w-full flex-row items-center justify-end gap-2">
            {!hideCancelBtn && (
                <Button onClicked={btnCancelCallback}>{i18n.t('cancelButton')}</Button>
            )}
            <Button onClicked={btnAcceptCallback} disabled={disabledAccept}>
                {btnAcceptLabel}
            </Button>
        </div>
    );
}

export default DialogFooter;
