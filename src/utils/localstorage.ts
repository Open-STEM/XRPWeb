const StorageKeys = {
    LOGLEVEL: 'LogLevel',
    ACTIVETAB: 'ActiveTab',
    EDITORSTORE: 'EditorStores',
    VERSION: 'Version',
    XRPUSER: 'XrpUser',
    GOOUSER: 'GooUser',
    LANGUAGE: 'i18nextLng',
    THEME: 'Theme'
  } as const;
  
  export type StorageKeysType = (typeof StorageKeys)[keyof typeof StorageKeys];
  
  export { StorageKeys };