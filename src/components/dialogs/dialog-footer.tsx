import i18n from '@/utils/i18n';
import Button from '@/widgets/button';

type DialogFooterProps = {
    btnAcceptLabel: string;
    btnAcceptCallback: () => void;
    btnCancelCallback: () => void;
};

function DialogFooter({btnAcceptLabel, btnAcceptCallback, btnCancelCallback }: DialogFooterProps) {
    return (
        <div className="flex w-full flex-row items-center justify-end gap-2">
            <Button onClicked={btnCancelCallback}>
                <label>{i18n.t('cancelButton')}</label>
            </Button>
            <Button onClicked={btnAcceptCallback}>
                <label>{btnAcceptLabel}</label>
            </Button>
        </div>
    );
}

export default DialogFooter;
