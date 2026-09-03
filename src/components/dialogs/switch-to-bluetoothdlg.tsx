import DialogFooter from '@/components/dialogs/dialog-footer';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type SwitchToBluetoothProps = {
    xrpId: string;
    powerswitchImage?: string;
    needsPicker: boolean;
    isUsbConnected: () => boolean;
    cancelCallback: () => void;
    okayCallback: () => void;
};

/**
 * Pre-flight steps for moving a USB session onto Bluetooth. The robot only
 * advertises on battery power, so the power switch has to be on and the cable
 * out before we try to connect.
 *
 * Sized to fit a short laptop viewport: the artwork scales down and the body
 * scrolls rather than pushing the buttons off screen.
 */
export default function SwitchToBluetoothDlg({
    xrpId,
    powerswitchImage,
    needsPicker,
    isUsbConnected,
    cancelCallback,
    okayCallback,
}: SwitchToBluetoothProps) {
    const { t } = useTranslation();
    const [stillOnUsb, setStillOnUsb] = useState(false);

    /** Continue is blocked while the cable owns the REPL. */
    function onContinue() {
        if (isUsbConnected()) {
            setStillOnUsb(true);
            return;
        }
        setStillOnUsb(false);
        okayCallback();
    }

    return (
        <div className="flex max-h-[85vh] w-96 flex-col gap-2 overflow-y-auto rounded-md border border-mountain-mist-700 p-5 shadow-md transition-all dark:border-shark-500 dark:bg-shark-950">
            <div className="flex flex-col items-center">
                <h1 className="text-base font-bold text-mountain-mist-700 dark:text-mountain-mist-300">
                    {t('switchToBluetooth')}
                </h1>
                <p className="text-center text-xs text-mountain-mist-700 dark:text-mountain-mist-300">
                    {t('switchToBluetoothIntro', { id: xrpId })}
                </p>
            </div>
            <hr className="w-full border-mountain-mist-600" />
            <ol className="flex list-decimal flex-col gap-0.5 pl-5 text-sm text-mountain-mist-900 dark:text-mountain-mist-300">
                <li>{t('switchToBluetoothStep1')}</li>
                <li>{t('switchToBluetoothStep2')}</li>
                {needsPicker && <li>{t('switchToBluetoothStep3', { id: xrpId })}</li>}
            </ol>
            {powerswitchImage && (
                <img
                    className="max-h-40 w-auto self-center object-contain"
                    src={powerswitchImage}
                    alt={t('power-switch')}
                />
            )}
            {stillOnUsb && (
                <span
                    data-testid="usb-still-connected"
                    className="text-sm font-medium text-cinnabar-600 dark:text-cinnabar-400"
                >
                    {t('bleSwitchUsbStillConnected', { id: xrpId })}
                </span>
            )}
            <hr className="w-full border-mountain-mist-600" />
            <DialogFooter
                disabledAccept={false}
                btnAcceptLabel={t('continueButton')}
                btnCancelCallback={cancelCallback}
                btnAcceptCallback={onContinue}
            />
        </div>
    );
}
