export type MenuDataItem = {
    label: string;
    isFile?: boolean;
    isView?: boolean;
    showif?: boolean;
    link?: string;
    iconImage?: string;
    clicked?: () => void;
    children?: MenuDataItem[];
    childrenExt?: MenuDataItem[];
};
