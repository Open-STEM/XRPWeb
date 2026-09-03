import { fireEvent, render, screen } from '@testing-library/react';
import SwitchToBluetoothDlg from '../dialogs/switch-to-bluetoothdlg';
import i18n from '@/utils/i18n';
import { describe, expect, it, vi } from 'vitest';

describe('SwitchToBluetoothDlg', () => {
    it('tells the user to power on and unplug before connecting', () => {
        render(
            <SwitchToBluetoothDlg
                xrpId="02d2c"
                needsPicker={false}
                isUsbConnected={() => false}
                cancelCallback={vi.fn()}
                okayCallback={vi.fn()}
            />,
        );
        expect(screen.getByText(i18n.t('switchToBluetoothStep1'))).toBeInTheDocument();
        expect(screen.getByText(i18n.t('switchToBluetoothStep2'))).toBeInTheDocument();
        expect(
            screen.queryByText(i18n.t('switchToBluetoothStep3', { id: '02d2c' })),
        ).not.toBeInTheDocument();
    });

    it('warns about the browser chooser only when pairing is still needed', () => {
        render(
            <SwitchToBluetoothDlg
                xrpId="02d2c"
                needsPicker={true}
                isUsbConnected={() => false}
                cancelCallback={vi.fn()}
                okayCallback={vi.fn()}
            />,
        );
        expect(
            screen.getByText(i18n.t('switchToBluetoothStep3', { id: '02d2c' })),
        ).toBeInTheDocument();
    });

    it('runs the callbacks', () => {
        const okayCallback = vi.fn();
        const cancelCallback = vi.fn();
        render(
            <SwitchToBluetoothDlg
                xrpId="02d2c"
                needsPicker={false}
                isUsbConnected={() => false}
                cancelCallback={cancelCallback}
                okayCallback={okayCallback}
            />,
        );
        fireEvent.click(screen.getByText(i18n.t('continueButton')));
        expect(okayCallback).toHaveBeenCalled();
        fireEvent.click(screen.getByText(i18n.t('cancelButton')));
        expect(cancelCallback).toHaveBeenCalled();
    });

    it('blocks Continue while the USB cable is still connected', () => {
        const okayCallback = vi.fn();
        const isUsbConnected = vi.fn().mockReturnValue(true);
        render(
            <SwitchToBluetoothDlg
                xrpId="02d2c"
                needsPicker={false}
                isUsbConnected={isUsbConnected}
                cancelCallback={vi.fn()}
                okayCallback={okayCallback}
            />,
        );
        fireEvent.click(screen.getByText(i18n.t('continueButton')));
        expect(okayCallback).not.toHaveBeenCalled();
        expect(
            screen.getByText(i18n.t('bleSwitchUsbStillConnected', { id: '02d2c' })),
        ).toBeInTheDocument();

        isUsbConnected.mockReturnValue(false);
        fireEvent.click(screen.getByText(i18n.t('continueButton')));
        expect(okayCallback).toHaveBeenCalled();
    });
});
