import Button from '@/widgets/button';
import { useTranslation } from 'react-i18next';

type DialogFooterProps = {
    hideCancelBtn?: boolean;
    disabledAccept?: boolean;
    btnAcceptLabel: string;
    btnCancelLabel?: string;
    btnAcceptCallback: () => void;
    btnCancelCallback: () => void;
};

function DialogFooter({
    hideCancelBtn,
    disabledAccept,
    btnAcceptLabel,
    btnCancelLabel,
    btnAcceptCallback,
    btnCancelCallback,
}: DialogFooterProps) {
    const { t } = useTranslation();
    return (
        <div className="flex w-full flex-row flex-wrap items-center justify-end gap-2">
            {!hideCancelBtn && (
                <Button onClicked={btnCancelCallback}>{btnCancelLabel ?? t('cancelButton')}</Button>
            )}
            <Button onClicked={btnAcceptCallback} disabled={disabledAccept}>
                {btnAcceptLabel}
            </Button>
        </div>
    );
}

export default DialogFooter;
