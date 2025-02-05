const StorageKeys = {
    LOGLEVEL: 'LogLevel',
  } as const;
  
  export type StorageKeysType = (typeof StorageKeys)[keyof typeof StorageKeys];
  
  export { StorageKeys };