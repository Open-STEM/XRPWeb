import { afterEach, describe, expect, it } from 'vitest';
import { ConnectionType } from '@/utils/types';
import { StorageKeys } from '@/utils/localstorage';
import {
    advertisedXrpName,
    bluetoothRequestFilters,
    clearRememberedXrp,
    getRememberedXrp,
    matchPermittedBluetoothDevice,
    saveRememberedXrp,
} from '@/utils/rememberedxrp';

describe('remembered XRP', () => {
    afterEach(() => {
        clearRememberedXrp();
    });

    it('returns null when nothing is stored', () => {
        expect(getRememberedXrp()).toBeNull();
    });

    it('persists id and connection type from USB', () => {
        saveRememberedXrp({ xrpId: '02d2c', lastConnectionType: ConnectionType.USB });
        expect(getRememberedXrp()).toEqual({
            xrpId: '02d2c',
            lastConnectionType: 'usb',
            bleDeviceId: undefined,
        });
    });

    it('keeps bleDeviceId when the same robot reconnects over USB', () => {
        saveRememberedXrp({
            xrpId: '02d2c',
            lastConnectionType: ConnectionType.BLUETOOTH,
            bleDeviceId: 'device-1',
        });
        saveRememberedXrp({ xrpId: '02d2c', lastConnectionType: ConnectionType.USB });
        expect(getRememberedXrp()?.bleDeviceId).toBe('device-1');
        expect(getRememberedXrp()?.lastConnectionType).toBe('usb');
    });

    it('drops bleDeviceId when a different robot is saved', () => {
        saveRememberedXrp({
            xrpId: '02d2c',
            lastConnectionType: ConnectionType.BLUETOOTH,
            bleDeviceId: 'device-1',
        });
        saveRememberedXrp({ xrpId: 'abcde', lastConnectionType: ConnectionType.USB });
        expect(getRememberedXrp()).toEqual({
            xrpId: 'abcde',
            lastConnectionType: 'usb',
            bleDeviceId: undefined,
        });
    });

    it('ignores corrupt storage', () => {
        localStorage.setItem(StorageKeys.REMEMBERED_XRP, '{not-json');
        expect(getRememberedXrp()).toBeNull();
    });
});

describe('matchPermittedBluetoothDevice', () => {
    it('matches a stored Web Bluetooth device id even when name is missing', () => {
        const devices = [
            { id: 'opaque-a', name: null },
            { id: 'opaque-b', name: null },
        ];
        expect(
            matchPermittedBluetoothDevice(devices, { xrpId: '02d2c', bleDeviceId: 'opaque-b' })?.id,
        ).toBe('opaque-b');
    });

    it('matches advertised name or id suffix', () => {
        const devices = [
            { id: 'a', name: 'XRP-abcde' },
            { id: 'b', name: 'XRP-02d2c' },
        ];
        expect(matchPermittedBluetoothDevice(devices, { xrpId: '02d2c' })?.id).toBe('b');
    });

    it('uses the only permitted device when names are empty', () => {
        expect(
            matchPermittedBluetoothDevice([{ id: 'only', name: null }], { xrpId: '02d2c' })?.id,
        ).toBe('only');
    });

    it('uses the only XRP-named device among others', () => {
        const devices = [
            { id: 'phone', name: 'Pixel Buds' },
            { id: 'xrp', name: 'XRP-02d2c' },
        ];
        expect(matchPermittedBluetoothDevice(devices, { xrpId: 'fffff' })?.id).toBe('xrp');
    });

    it('returns undefined when several unnamed devices cannot be distinguished', () => {
        expect(
            matchPermittedBluetoothDevice(
                [
                    { id: 'a', name: null },
                    { id: 'b', name: null },
                ],
                { xrpId: '02d2c' },
            ),
        ).toBeUndefined();
    });
});

describe('bluetoothRequestFilters', () => {
    it('filters to the advertised name when an id is known', () => {
        expect(bluetoothRequestFilters({ xrpId: '02d2c' })).toEqual([{ name: 'XRP-02d2c' }]);
        expect(advertisedXrpName('02d2c')).toBe('XRP-02d2c');
    });

    it('uses the classroom-wide prefix when showing all or when no id is known', () => {
        expect(bluetoothRequestFilters({ showAll: true })).toEqual([{ namePrefix: 'XRP' }]);
        expect(bluetoothRequestFilters({ xrpId: '02d2c', showAll: true })).toEqual([
            { namePrefix: 'XRP' },
        ]);
        expect(bluetoothRequestFilters()).toEqual([{ namePrefix: 'XRP' }]);
    });
});
