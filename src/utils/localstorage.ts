const StorageKeys = {
    LOGLEVEL: 'LogLevel',
    VIEWSETTING: 'ViewSetting',
    ACTIVETAB: 'ActiveTab',
    EDITORSTORE: 'EditorStores',
    VERSION: 'Version',
  } as const;
  
  export type StorageKeysType = (typeof StorageKeys)[keyof typeof StorageKeys];
  
  export { StorageKeys };