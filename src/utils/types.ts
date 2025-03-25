
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

export enum EditorType {
    BLOCKLY = 'blockly',
    PYTHON = 'python'
}

export enum ConnectionCMD {
    CONNECT_USB = 'usb-connection',
    CONNECT_BLUETOOTH = 'bluetooth-connection',
    CONNECT_RUN = 'run',
    CONNECT_STOP = 'stop'
}

export enum FontSize {
    INCREASE = 'increase',
    DESCREASE = 'descrease'
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
    image?: string;
};

export type NewFileData = {
    name: string;
    path: string,
    filetype: FileType
    parentId: string;
    content?: string;
}

export type SettingData = {
    view: number
}

export type FileData = {
    name: string;
    content: string;
}

export type Versions = {
    currentVersion: string;
    newVersion: string;
}