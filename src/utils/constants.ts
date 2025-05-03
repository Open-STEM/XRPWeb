export class Constants {
    static readonly APP_VERSION = '2.0.1';
    static readonly EDITOR_TABSET_ID = 'editorTabSetId';
    static readonly SHELL_TABSET_ID = 'shellTabSetId';
    static readonly FOLDER_TAB_ID = 'folderTabId';
    static readonly DEFAULT_FONTSIZE = 14;
    static readonly TRASH_FOLDER = '/trash';
    static readonly SHOW_CHANGELOG = 'show-changelog';
    static readonly STORAGE_KEY = 'sensor-dashboard-layout';
    static readonly THEME_STORAGE_KEY = 'sensorboard-theme';
    static readonly CELL_HEIGHT = 50;
    
    static readonly BREAKPOINTS = [
        { c: 1, w: 700 },
        { c: 3, w: 850 },
        { c: 6, w: 950 },
        { c: 8, w: 1100 },
      ];
}