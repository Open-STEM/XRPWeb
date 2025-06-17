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

// AI Chat Types
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    model?: string;
    provider?: string;
}

export interface ChatModel {
    id: string;
    name: string;
    provider: string;
    description?: string;
}

export interface ChatProvider {
    id: string;
    name: string;
    models: ChatModel[];
}

export enum ChatStatus {
    IDLE = 'idle',
    LOADING = 'loading',
    STREAMING = 'streaming',
    ERROR = 'error'
}

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

declare module 'markdown-it-footnote';
declare module 'markdown-it-deflist';
declare module 'markdown-it-abbr';