export type MenuDataItem = {
    label: string;
    isFile?: boolean;
    link?: string;
    iconImage?: string;
    clicked?: () => void;
    children?: MenuDataItem[];
    childrenExt?: MenuDataItem[];
};