/// <reference types="web-bluetooth" />
import { ConnectionType } from '@/utils/types';
import { StorageKeys } from '@/utils/localstorage';

export type RememberedConnectionType = 'usb' | 'bluetooth';

export type RememberedXrp = {
    xrpId: string;
    bleDeviceId?: string;
    lastConnectionType: RememberedConnectionType;
};

export function advertisedXrpName(xrpId: string): string {
    return `XRP-${xrpId}`;
}

export function connectionTypeToRemembered(connType: ConnectionType): RememberedConnectionType {
    return connType === ConnectionType.BLUETOOTH ? 'bluetooth' : 'usb';
}

export function getRememberedXrp(): RememberedXrp | null {
    const raw = localStorage.getItem(StorageKeys.REMEMBERED_XRP);
    if (!raw) {
        return null;
    }
    try {
        const parsed = JSON.parse(raw) as Partial<RememberedXrp>;
        if (typeof parsed.xrpId !== 'string' || parsed.xrpId.length === 0) {
            return null;
        }
        const lastConnectionType =
            parsed.lastConnectionType === 'bluetooth' ? 'bluetooth' : 'usb';
        return {
            xrpId: parsed.xrpId,
            bleDeviceId: typeof parsed.bleDeviceId === 'string' ? parsed.bleDeviceId : undefined,
            lastConnectionType,
        };
    } catch {
        return null;
    }
}

export function saveRememberedXrp(update: {
    xrpId: string;
    lastConnectionType: ConnectionType;
    bleDeviceId?: string;
}): RememberedXrp {
    const current = getRememberedXrp();
    const xrpIdChanged = current !== null && current.xrpId !== update.xrpId;
    const remembered: RememberedXrp = {
        xrpId: update.xrpId,
        lastConnectionType: connectionTypeToRemembered(update.lastConnectionType),
        bleDeviceId: xrpIdChanged
            ? update.bleDeviceId
            : (update.bleDeviceId ?? current?.bleDeviceId),
    };
    localStorage.setItem(StorageKeys.REMEMBERED_XRP, JSON.stringify(remembered));
    return remembered;
}

export function clearRememberedXrp(): void {
    localStorage.removeItem(StorageKeys.REMEMBERED_XRP);
}

export function saveRememberedBleDeviceId(bleDeviceId: string): void {
    const current = getRememberedXrp();
    if (!current) {
        return;
    }
    localStorage.setItem(
        StorageKeys.REMEMBERED_XRP,
        JSON.stringify({ ...current, bleDeviceId }),
    );
}

export function bluetoothRequestFilters(options?: {
    xrpId?: string;
    showAll?: boolean;
}): BluetoothLEScanFilter[] {
    if (options?.xrpId && !options.showAll) {
        return [{ name: advertisedXrpName(options.xrpId) }];
    }
    return [{ namePrefix: 'XRP' }];
}

type NamedBluetoothDevice = {
    id: string;
    name?: string | null;
};

function deviceNameMatchesXrpId(name: string | null | undefined, xrpId: string): boolean {
    if (!name) {
        return false;
    }
    const n = name.toLowerCase();
    const id = xrpId.toLowerCase();
    return n === advertisedXrpName(xrpId).toLowerCase() || n.endsWith(id) || n.includes(id);
}

/**
 * Pick an already-permitted Web Bluetooth device without opening the OS chooser.
 * Chrome often omits `name` on getDevices() results until advertisements are seen,
 * so we also accept a stored device.id or a single permitted XRP.
 */
export function matchPermittedBluetoothDevice<T extends NamedBluetoothDevice>(
    devices: T[],
    options: { xrpId?: string; bleDeviceId?: string },
): T | undefined {
    if (devices.length === 0) {
        return undefined;
    }
    if (options.bleDeviceId) {
        const byId = devices.find((device) => device.id === options.bleDeviceId);
        if (byId) {
            return byId;
        }
    }
    if (options.xrpId) {
        const byName = devices.find((device) => deviceNameMatchesXrpId(device.name, options.xrpId!));
        if (byName) {
            return byName;
        }
    }
    const xrpNamed = devices.filter((device) => (device.name ?? '').toUpperCase().startsWith('XRP'));
    if (xrpNamed.length === 1) {
        return xrpNamed[0];
    }
    if (devices.length === 1) {
        return devices[0];
    }
    return undefined;
}
