import pino from 'pino';
import { StorageKeys, StorageUtility } from '@utils/localstorage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loglevel:any = StorageUtility.getItem(StorageKeys.LOGLEVEL);

// Create a logging instance
export const logger = pino({
    level: loglevel.Level || 'info',
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    redact: {
      paths: [],
    },
    transport: {
        target: 'pino-pretty'
    },
    timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
    browser: {
        asObject: true,
      },
  });

export default logger;