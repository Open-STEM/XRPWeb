import logger from "@/utils/logger";

export type UserProfile = {
    id: string;
    email: string;
    verified_email?: boolean;
    family_name?: string;
    given_name?: string;
    locale?: string;
    hd?: string; // hosted domain
    name: string;
    picture: string;
};

export type UserInfo = {
    access_token: string;
    refresh_token: string;
    expires_in: number;
};

/**
 * GoogleAuthService is a service to handle Google authentication,
 * relying on backend endpoints for token management.
 */
class GoogleAuthService {
    private _isLogin: boolean = false;
    private _isAdmin: boolean = false;
    private _refreshToken: string | null = null;
    private _expiresIn: number | null = null;
    private _accessToken: string | null = null;
    private _timeoutId: NodeJS.Timeout | undefined;
    private _userProfile: UserProfile;
    private _modeLogger = logger.child({ module: 'googleapi' });
    
    constructor() {
        this._userProfile = { id: '', email: '', name: '', picture: '' };
    }

    dispose() {
        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
            this._timeoutId = undefined;
        }
    }

    /**
     * isLogin - checks if the user is logged in.
     */
    get isLogin() {
        return this._isLogin;
    }

    /**
     * Sets the login status of the user.
     * @param isLogin sets the login status of the user.
     */
    set isLogin(isLogin: boolean) {
        this._isLogin = isLogin;
    }

    /**
     * Sets the user profile information.
     * @param profile The user profile object containing email, name, and picture.
     */
    set userProfile(profile: UserProfile) {
        this._userProfile = profile;
    }

    /**
     * Gets the user profile information.
     * @returns The user profile object containing email, name, and picture.
     */
    get userProfile() {
        return this._userProfile;
    }

    /**
     * Gets the user information including access token, refresh token, and expiration time.
     * @returns An object containing access_token, refresh_token, and expires_in.
     */
    get userInfo(): UserInfo {
        return {
            access_token: this._accessToken ?? '',
            refresh_token: this._refreshToken ?? '',
            expires_in: this._expiresIn ?? 0,
        };
    }

    /**
     * Get the is admin property
     */
    get isAdmin(): boolean {
        return this._isAdmin;
    }

    /**
     * Set the isAdmin property
     */
    set isAdmin(isAdmin: boolean) {
        this._isAdmin = isAdmin;
    }
    
    /**
     * Initiates the Google Sign-In flow by redirecting to the backend login endpoint.
     */
    initiateGoogleSignIn() {
        window.location.href = 'http://localhost:8000/api/auth/google/login';
    }

    /**
     * Logs out the user from Google via the backend.
     */
    async logOut() {
        try {
            await fetch('/api/auth/google/logout', { method: 'POST', credentials: 'include' });
            this._isLogin = false;
            // Optionally, clear local storage or state related to user
        } catch (error) {
            this._modeLogger.error(`Error logging out: ${error}`);
        }
    }
}

export default GoogleAuthService;