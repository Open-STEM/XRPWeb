import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void): () => void {
    window.addEventListener('online', onChange);
    window.addEventListener('offline', onChange);
    return () => {
        window.removeEventListener('online', onChange);
        window.removeEventListener('offline', onChange);
    };
}

/**
 * Whether the browser reports a network connection. The IDE runs offline
 * from the service worker cache; this gates the features that need a
 * backend (Google Drive, AI Buddy).
 */
export function useOnlineStatus(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => navigator.onLine,
        () => true,
    );
}
