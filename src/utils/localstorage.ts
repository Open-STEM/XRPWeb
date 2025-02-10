const StorageKeys = {
    LOGLEVEL: 'LogLevel',
    VIEWSETTING: 'ViewSetting'
  } as const;
  
  export type StorageKeysType = (typeof StorageKeys)[keyof typeof StorageKeys];
  
  export { StorageKeys };