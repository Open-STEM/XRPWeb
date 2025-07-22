import logger from "@/utils/logger";
import { googleLogout } from "@react-oauth/google";

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
 * including obtaining access tokens and refreshing them.
 */
class GoogleAuthService {
    // Define the constructor with parameters if needed{
    private _tokenUrl: string = 'https://oauth2.googleapis.com/token';
    private _clientId: string;
    private _isLogin: boolean = false;
    private _isAdmin: boolean = false;
    private _clientSecret: string;
    private _redirectUri: string;
    private _code: string | null = null;
    private _refreshToken: string | null = null;
    private _expiresIn: number | null = null;
    private _accessToken: string | null = null;
    private _timeoutId: NodeJS.Timeout | undefined
    private _userProfile: UserProfile;
    private _modeLogger = logger.child({ module: 'googleapi' });
    

    constructor() {
        this._clientId = import.meta.env.GOOGLE_CLIENT_ID || '';
        this._clientSecret = import.meta.env.GOOGLE_CLIENT_SECRET || '';
        this._redirectUri = import.meta.env.GOOGLE_REDIRECT_URI || '';
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
     * Refreshes the access token using the stored refresh token.
     * @returns A Promise that resolves to the new access token.
     */
    private async refreshToken() 
    {        
        if (this._refreshToken) {
            this.getAccessToken().then((token) => {
                this._accessToken = token;
                this._modeLogger.debug('Access Token refreshed: ', this._accessToken);
            }).catch((error) => {
                this._modeLogger.error('Error refreshing access token:', error);
            });
        } else {
            this._modeLogger.warn('No refresh token available to refresh access token.');
        }
        // Set a timeout to refresh the token again after the current token expires
        this._timeoutId = setTimeout(this.refreshToken.bind(this), this._expiresIn ? this._expiresIn * 1000 * .95 : 3600000); // Default to 1 hour if expires_in is not set
    }

    /**
     * Sets the authorization code received from Google OAuth.
     * @param code The authorization code.
     */
    setCode(code: string) {
        this._code = code;
    }

    /** * Logs out the user from Google.
    * This will clear the stored tokens and redirect the user to the Google logout endpoint.
    */
    async logOut() {
      // Logic to handle Google logout
      googleLogout();
      this._isLogin = false;
    }

    /**
     * Retrieves the access token using the stored refresh token.
     * @returns A Promise that resolves to the access token.
     */
    async getAccessToken() {
        const payload = {
            grant_type: 'refresh_token',
            refresh_token: this._refreshToken ?? '',
            client_id: this._clientId,
            client_secret: this._clientSecret,
        };

        try {
            const response = fetch(this._tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(payload).toString(),
            });

            return (await response).json().then(data => {
                if (data.access_token) {
                    this._accessToken = data.access_token;
                    this._expiresIn = data.expires_in;
                    return data.access_token;
                } else {
                    throw new Error('Failed to get access token');
                }
            });
        }
        catch (error) {
            this._modeLogger.error('Error fetching access token:', error);
            throw error;
        }
    };

    /**
     * Retrieves a new access token using the authorization code.
     * @returns A Promise that resolves to an object containing access_token, refresh_token, and expires_in.
     */
    async getRefreshToken() {
        const payload = {
            grant_type: 'authorization_code',
            code: this._code ?? '',
            client_id: this._clientId,
            client_secret: this._clientSecret,
            redirect_uri: this._redirectUri,
        };

        try {
            const response = fetch(this._tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(payload).toString(),
            });

            return (await response).json().then(data => {
                if (data.access_token) {
                    this._timeoutId = setTimeout(() => this.refreshToken(), 1000);
                    this._accessToken = data.access_token;
                    this._refreshToken = data.refresh_token;
                    this._expiresIn = data.expires_in;
                    return { access_token: data.access_token, refresh_token: data.refresh_token, expires_in: data.expires_in };
                } else {
                    throw new Error('Failed to refresh access token');
                }
            });
        }
        catch (error) {
            this._modeLogger.error('Error refreshing access token:', error);
            throw error;
        }   
    }
}

export default GoogleAuthService;