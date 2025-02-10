const StorageKeys = {
    LOGLEVEL: 'LogLevel',
    VIEWSETTING: 'ViewSetting',
    ACTIVETAB: 'ActiveTab',
  } as const;
  
  export type StorageKeysType = (typeof StorageKeys)[keyof typeof StorageKeys];
  
  export { StorageKeys };