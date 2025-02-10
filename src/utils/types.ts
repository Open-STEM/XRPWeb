export enum ConnectionType {
    USB,
    BLUETOOTH,
}

export enum FileType {
    BLOCKLY,
    PYTHON,
    OTHER
}

export enum ViewType {
    FOLDER = 0,
    SYSTEM = 1
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
    parent?: FolderItem;
    children: FolderItem[] | null;
};

export type ListItem = {
    label: string;
    image: string;
};

export type NewFileData = {
    name: string;
    path: string,
    filetype: FileType
    parentId: string;
}

export type SettingData = {
    view: number
}