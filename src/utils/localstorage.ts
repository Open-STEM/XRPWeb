const StorageKeys = {
    LOGLEVEL: 'LogLevel',
  } as const;
  
  export type StorageKeysType = (typeof StorageKeys)[keyof typeof StorageKeys];
  
  class StorageUtility {
    static setItem<T>(key: StorageKeysType, value: T): void {
      try {
        const jsonValue = JSON.stringify(value);
        localStorage.setItem(key, jsonValue);
      } catch (e) {
        console.log(e);
      }
    }
  
    static getItem<T>(key: StorageKeysType): T | null {
      try {
        const jsonValue = localStorage.getItem(key);
        const value = jsonValue != null ? JSON.parse(jsonValue) : null;
        return value;
      } catch (e) {
        console.log(e);
        return null;
      }
    }
  
    static removeItem(key: StorageKeysType): void {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.log(e);
      }
    }
  
    static clear(): void {
      try {
        localStorage.clear();
      } catch (e) {
        console.log(e);
      }
    }
  
    static getMultipleItems(
      keys: Array<StorageKeysType>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Record<StorageKeysType, any> | undefined {
      try {
        const result = localStorage.multiGet(keys);
        const final = result.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (pre: any, curr: any[]) => {
            const val = curr[1] ? JSON.parse(curr[1]) : null;
            return {
              ...pre,
              [curr[0]]: val,
            };
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {} as Record<StorageKeysType, any>,
        );
        return final;
      } catch (e) {
        console.log(e);
      }
    }
  }
  
  export { StorageUtility, StorageKeys };