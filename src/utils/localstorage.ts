const StorageKeys = {
    LOGLEVEL: 'LogLevel',
    ACTIVETAB: 'ActiveTab',
    EDITORSTORE: 'EditorStores',
    VERSION: 'Version',
    XRPUSER: 'XrpUser',
    GOOUSER: 'GooUser',
    LANGUAGE: 'i18nextLng',
    THEME: 'Theme',
    LAST_GOOGLE_DRIVE_TO_XRP_SAVE_TIME: 'LastGoogleDriveToXrpSaveTime',
    LAST_GOOGLE_DRIVE_TO_XRP_SAVE_TIME_CONFIG: 'LastGoogleDriveToXrpSaveTimeConfig',
  } as const;
  
  export type StorageKeysType = (typeof StorageKeys)[keyof typeof StorageKeys];
  
  export { StorageKeys };