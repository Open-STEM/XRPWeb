import { fireEvent, render, screen } from '@testing-library/react';
import BleReconnectFailedDlg from '../dialogs/ble-reconnect-faileddlg';
import i18n from '@/utils/i18n';
import { BleConnectFailure } from '@/utils/types';
import { describe, expect, it, vi } from 'vitest';

describe('BleReconnectFailedDlg', () => {
    it('shows the missing-robot message with the chooser action', () => {
        const onRetry = vi.fn();
        const onSecondary = vi.fn();
        render(
            <BleReconnectFailedDlg
                xrpId="02d2c"
                reason={BleConnectFailure.NOT_FOUND}
                onRetry={onRetry}
                onSecondary={onSecondary}
            />,
        );
        expect(screen.getByText(i18n.t('bleReconnectFailed', { id: '02d2c' }))).toBeInTheDocument();
        fireEvent.click(screen.getByText(i18n.t('tryAgain')));
        expect(onRetry).toHaveBeenCalled();
        fireEvent.click(screen.getByText(i18n.t('chooseDifferentXRP')));
        expect(onSecondary).toHaveBeenCalled();
    });

    it('shows the battery guidance with a USB action when the picker was cancelled', () => {
        const onRetry = vi.fn();
        const onSecondary = vi.fn();
        render(
            <BleReconnectFailedDlg
                xrpId="02d2c"
                reason={BleConnectFailure.CANCELLED}
                onRetry={onRetry}
                onSecondary={onSecondary}
            />,
        );
        expect(screen.getByText(i18n.t('bleConnectCancelled', { id: '02d2c' }))).toBeInTheDocument();
        fireEvent.click(screen.getByText(i18n.t('usbConnection')));
        expect(onSecondary).toHaveBeenCalled();
    });

    it('offers Bluetooth or USB by name when the cable holds another robot', () => {
        const onRetry = vi.fn();
        const onSecondary = vi.fn();
        render(
            <BleReconnectFailedDlg
                xrpId="02d2c"
                reason={BleConnectFailure.WRONG_USB_XRP}
                otherXrpId="9f1a4"
                onRetry={onRetry}
                onSecondary={onSecondary}
            />,
        );
        expect(
            screen.getByText(i18n.t('bleWrongUsbXrp', { id: '02d2c', otherId: '9f1a4' })),
        ).toBeInTheDocument();
        expect(screen.queryByText(i18n.t('tryAgain'))).not.toBeInTheDocument();
        fireEvent.click(screen.getByText(i18n.t('bluetoothConnection')));
        expect(onRetry).toHaveBeenCalled();
        fireEvent.click(screen.getByText(i18n.t('usbConnection')));
        expect(onSecondary).toHaveBeenCalled();
    });

    it('tells the user to unplug USB when the cable still owns the session', () => {
        render(
            <BleReconnectFailedDlg
                xrpId="02d2c"
                reason={BleConnectFailure.USB_STILL_CONNECTED}
                onRetry={vi.fn()}
                onSecondary={vi.fn()}
            />,
        );
        expect(
            screen.getByText(i18n.t('bleSwitchUsbStillConnected', { id: '02d2c' })),
        ).toBeInTheDocument();
    });
});
