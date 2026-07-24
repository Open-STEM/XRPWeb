import { createContext, useContext } from 'react';

/**
 * OAuth client ID fetched from the auth backend at startup. Empty until it
 * arrives - and stays empty when no backend is configured or it cannot be
 * reached. Google's GSI client throws on an empty ID, so components that use
 * the OAuth hooks must not mount until this has a value.
 */
export const GoogleClientIdContext = createContext<string>('');

export function useGoogleClientId(): string {
    return useContext(GoogleClientIdContext);
}
