export enum ConnectionType {
    USB,
    BLUETOOTH,
}

export enum ConnectionCMD{
    CONNECT_USB = 'usb-connection',
    CONNECT_BLUETOOTH = 'bluetooth-connection',
    CONNECT_RUN = 'run',
    CONNECT_STOP = 'stop'
}

export interface FolderItem {
    id: string;
    name: string;
    isReadOnly: boolean;
    icon?: React.ComponentType;
    path: string;
    children: FolderItem[] | null;
};
