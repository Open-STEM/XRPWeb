export type MenuDataItem = {
    label: string;
    link?: string;
    iconImage?: string;
    clicked?: () => void;
    children?: MenuDataItem[];
    childrenExt?: MenuDataItem[];
};