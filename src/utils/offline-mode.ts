import { useSyncExternalStore } from 'react';
import { StorageKeys } from '@/utils/localstorage';

/**
 * Offline version opt-in. The web app runs normally (no service worker, no
 * 55 MB download) until the user picks Download Offline Version from the
 * more menu; from then on the service worker keeps a full copy cached.
 */

const listeners = new Set<() => void>();
let enabled = readEnabled();

function readEnabled(): boolean {
    let flag = false;
    try {
        flag = localStorage.getItem(StorageKeys.OFFLINE_VERSION) === 'true';
    } catch {
        // storage blocked - fall back to whether a worker already controls the page
    }
    return flag || !!navigator.serviceWorker?.controller;
}

function setEnabled(value: boolean) {
    enabled = value;
    try {
        if (value) {
            localStorage.setItem(StorageKeys.OFFLINE_VERSION, 'true');
        } else {
            localStorage.removeItem(StorageKeys.OFFLINE_VERSION);
        }
    } catch {
        // storage blocked - the setting lasts for this page only
    }
    listeners.forEach((l) => l());
}

/** The offline version needs a production build and service worker support. */
export function isOfflineVersionSupported(): boolean {
    return import.meta.env.PROD && 'serviceWorker' in navigator;
}

export function useOfflineVersionEnabled(): boolean {
    return useSyncExternalStore(
        (onChange) => {
            listeners.add(onChange);
            return () => listeners.delete(onChange);
        },
        () => enabled,
    );
}

/** Start caching the app for offline use (registers the service worker). */
export function enableOfflineVersion() {
    setEnabled(true);
}

const MANIFEST_LINK_ID = 'offline-version-manifest';

/**
 * Link the web manifest so the browser offers to install the app. Called
 * only once the offline version is installed: the build leaves the link out
 * of index.html so an installed app always has its offline copy.
 */
export function addManifestLink() {
    if (document.getElementById(MANIFEST_LINK_ID)) return;
    const link = document.createElement('link');
    link.id = MANIFEST_LINK_ID;
    link.rel = 'manifest';
    link.href = './manifest.webmanifest';
    document.head.appendChild(link);
}

/** Unregister the service worker and delete its cached copy of the app. */
export async function removeOfflineVersion() {
    setEnabled(false);
    document.getElementById(MANIFEST_LINK_ID)?.remove();
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('workbox-')).map((k) => caches.delete(k)));
}

/**
 * Precache progress while the service worker installs: files cached so far
 * and the total listed in the worker's precache manifest.
 */
export async function getPrecacheProgress(swUrl: string): Promise<{ done: number; total: number }> {
    const text = await (await fetch(swUrl)).text();
    const total = (text.match(/\{url:"/g) ?? []).length;
    let done = 0;
    for (const key of await caches.keys()) {
        if (key.startsWith('workbox-precache')) {
            done += (await (await caches.open(key)).keys()).length;
        }
    }
    return { done, total };
}
