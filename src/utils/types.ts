export enum ConnectionType {
    USB,
    BLUETOOTH,
}

export interface FolderItem {
    id: string;
    name: string;
    isReadOnly: boolean;
    icon?: React.ComponentType;
    path: string;
    children: FolderItem[] | null;
};
