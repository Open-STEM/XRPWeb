import { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { addManifestLink, getPrecacheProgress } from '@/utils/offline-mode';

/** Check for a new deployment hourly while the app stays open. */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

type OfflineServiceWorkerProps = {
    /** Download progress (0-100) while the offline version is first cached. */
    onProgress: (percent: number) => void;
    /** The whole app is cached and will open without a network. */
    onOfflineReady: () => void;
    /** A new deployment is cached; call reload to switch to it. */
    onNeedRefresh: (reload: () => void) => void;
    /** Registration or the first download failed. */
    onError: () => void;
};

/**
 * OfflineServiceWorker - registers the service worker for the offline
 * version. Renders nothing; NavBar mounts it only once the user has chosen
 * Download Offline Version and shows the results in its dialogs. A new
 * version is only activated when the user agrees to reload, so open work is
 * not lost.
 */
export default function OfflineServiceWorker(props: OfflineServiceWorkerProps) {
    // useRegisterSW keeps the callbacks from the first render.
    const callbacks = useRef(props);
    callbacks.current = props;
    const [swUrl, setSwUrl] = useState<string>();

    const { updateServiceWorker } = useRegisterSW({
        onRegisteredSW(url, registration) {
            if (!registration) return;
            // Offer to install the app once a worker is active, i.e. the
            // whole app has been cached.
            navigator.serviceWorker.ready.then(addManifestLink);
            // First install: nothing cached yet, so report download progress.
            const installing = registration.installing;
            if (installing && !navigator.serviceWorker.controller) {
                setSwUrl(url);
                installing.addEventListener('statechange', () => {
                    if (installing.state === 'redundant') {
                        setSwUrl(undefined);
                        callbacks.current.onError();
                    }
                });
            }
            setInterval(async () => {
                if (registration.installing || !navigator.onLine) return;
                // Skip the check if the deployment cannot be reached.
                const resp = await fetch(url, { cache: 'no-store' }).catch(() => undefined);
                if (resp?.status === 200) {
                    await registration.update();
                }
            }, UPDATE_CHECK_INTERVAL_MS);
        },
        onOfflineReady() {
            setSwUrl(undefined);
            callbacks.current.onOfflineReady();
        },
        onNeedRefresh() {
            callbacks.current.onNeedRefresh(() => updateServiceWorker(true));
        },
        onRegisterError(error) {
            console.error('Service worker registration failed', error);
            // Only a failed first download is an error; an installed
            // offline version keeps working from its worker.
            if (!navigator.serviceWorker.controller) {
                callbacks.current.onError();
            }
        },
    });

    useEffect(() => {
        if (!swUrl) return;
        const timer = setInterval(async () => {
            const { done, total } = await getPrecacheProgress(swUrl);
            if (total) {
                callbacks.current.onProgress(Math.floor((100 * done) / total));
            }
        }, 500);
        return () => clearInterval(timer);
    }, [swUrl]);

    return null;
}
