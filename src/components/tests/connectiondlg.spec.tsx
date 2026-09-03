import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ConnectionDlg from '../dialogs/connectiondlg';
import i18n from '@/utils/i18n';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ConnectionCMD, ConnectionType } from '@/utils/types';
import { clearRememberedXrp, saveRememberedXrp } from '@/utils/rememberedxrp';

describe('ConnectionDlg', () => {
    beforeEach(() => {
        clearRememberedXrp();
        Object.defineProperty(navigator, 'bluetooth', {
            configurable: true,
            value: {
                getAvailability: () => Promise.resolve(true),
            },
        });
    });

    afterEach(() => {
        clearRememberedXrp();
    });

    it('renders Bluetooth connection option', () => {
        const cb = vi.fn();
        render(<ConnectionDlg callback={cb} />);
        const bluetoothText = i18n.t('bluetoothConnection');
        expect(screen.getByText(bluetoothText)).toBeInTheDocument();
    });

    it('renders USB connection option', () => {
        const cb = vi.fn();
        render(<ConnectionDlg callback={cb} />);
        const usbText = i18n.t('usbConnection');
        expect(screen.getByText(usbText)).toBeInTheDocument();
    });

    it('renders Bluetooth icon', () => {
        const cb = vi.fn();
        render(<ConnectionDlg callback={cb} />);
        const bluetoothIcon = screen.getByTestId(i18n.t('bluetoothConnection'));
        expect(bluetoothIcon).toBeInTheDocument();
    });

    it('renders USB icon', () => {
        const cb = vi.fn();
        render(<ConnectionDlg callback={cb} />);
        const usbIcon = screen.getByTestId(i18n.t('usbConnection'));
        expect(usbIcon).toBeInTheDocument();
    });

    it('omits the clear option when no robot is remembered', () => {
        const cb = vi.fn();
        render(<ConnectionDlg callback={cb} />);
        expect(screen.queryByTestId('clear-saved-xrp-id')).not.toBeInTheDocument();
        expect(screen.getByText(i18n.t('bluetoothConnection'))).toBeInTheDocument();
        expect(screen.getByText(i18n.t('usbConnection'))).toBeInTheDocument();
    });

    it('offers clear saved ID, Bluetooth and USB when a robot is remembered', () => {
        saveRememberedXrp({ xrpId: '02d2c', lastConnectionType: ConnectionType.USB });
        const cb = vi.fn();
        render(<ConnectionDlg callback={cb} />);
        expect(screen.getByText(i18n.t('clearSavedXrpId'))).toBeInTheDocument();
        expect(screen.getByText(i18n.t('bluetoothConnection'))).toBeInTheDocument();
        expect(screen.getByText(i18n.t('usbConnection'))).toBeInTheDocument();
    });

    it('emits clear, standard Bluetooth and USB commands', async () => {
        saveRememberedXrp({ xrpId: '02d2c', lastConnectionType: ConnectionType.USB });
        const cb = vi.fn();
        render(<ConnectionDlg callback={cb} />);
        fireEvent.click(screen.getByText(i18n.t('clearSavedXrpId')));
        expect(cb).toHaveBeenCalledWith(ConnectionCMD.CLEAR_DEFAULT_XRP);
        fireEvent.click(screen.getByText(i18n.t('usbConnection')));
        expect(cb).toHaveBeenCalledWith(ConnectionCMD.CONNECT_USB);
        await waitFor(() => {
            expect(screen.getByText(i18n.t('bluetoothConnection')).closest('li')).not.toHaveClass(
                'cursor-not-allowed',
            );
        });
        fireEvent.click(screen.getByText(i18n.t('bluetoothConnection')));
        expect(cb).toHaveBeenCalledWith(ConnectionCMD.CONNECT_BLUETOOTH_ALL);
    });
});
