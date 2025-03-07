import i18n from "@/utils/i18n";
import DialogFooter from "@components/dialogs/dialog-footer";
import XRPControllerPower from "@assets/images/XRP_Controller-Power.jpg";

interface PowerSwitchAlertProps {
    cancelCallback: () => void;
}

export default function PowerSwitchAlert({ cancelCallback }: PowerSwitchAlertProps) {
    return (
        <div className="flex h-auto w-96 flex-col gap-2 rounded-md border border-mountain-mist-700 p-8 shadow-md transition-all dark:border-shark-500 dark:bg-shark-950">
            <div className="flex flex-col items-center">
                <h1 className="text-lg font-bold text-mountain-mist-700">{i18n.t('power-switch-title')}</h1>
                <p className='text-sm text-mountain-mist-700'>{i18n.t('power-switch-alerts')}</p>
            </div>
            <hr className="w-full border-mountain-mist-600" />
            <img src={XRPControllerPower} width={'400px'} height={'400px'} alt={i18n.t('power-switch')} />
            <hr className="w-full border-mountain-mist-600" />
            <DialogFooter disabledAccept={false} btnAcceptLabel={i18n.t('okButton')} btnCancelCallback={cancelCallback} btnAcceptCallback={cancelCallback} />
        </div>
    );
}
