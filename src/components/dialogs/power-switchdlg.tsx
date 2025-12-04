import DialogFooter from "@components/dialogs/dialog-footer";
//import XRPControllerPowerBeta from "@assets/images/XRP_Controller-Power.jpg";
import { useTranslation } from "react-i18next";
//TODO: This needs to have some logic to display the correct image based on which board is attached.

interface PowerSwitchAlertProps {
    powerswitchImage?: string;
    cancelCallback: () => void;
}

export default function PowerSwitchAlert({ powerswitchImage, cancelCallback }: PowerSwitchAlertProps) {
    const { t } = useTranslation();
    return (
        <div className="flex h-auto w-96 flex-col gap-2 rounded-md border border-mountain-mist-700 p-8 shadow-md transition-all dark:border-shark-500 dark:bg-shark-950">
            <div className="flex flex-col items-center">
                <h1 className="text-lg font-bold text-mountain-mist-700">{t('power-switch-title')}</h1>
                <p className='text-sm text-mountain-mist-700'>{t('power-switch-alerts')}</p>
            </div>
            <hr className="w-full border-mountain-mist-600" />
            <img src={powerswitchImage} width={'400px'} height={'400px'} alt={t('power-switch')} />
            <hr className="w-full border-mountain-mist-600" />
            <DialogFooter disabledAccept={false} btnAcceptLabel={t('okButton')} btnCancelCallback={cancelCallback} btnAcceptCallback={cancelCallback} />
        </div>
    );
}
