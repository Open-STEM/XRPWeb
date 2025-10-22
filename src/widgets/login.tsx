import { useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import Button from './button';
import AppMgr from '@/managers/appmgr';
import logger from '@/utils/logger';
import { UserProfile } from '@/services/google-auth';
import { useTranslation } from 'react-i18next';

type LoginProps = {
    logoutCallback: () => void;
    onSuccess: (data: UserProfile) => void;
};

function Login({ logoutCallback, onSuccess }: LoginProps) {
    const { t } = useTranslation();
    const initUserProperties = {
        access_token: '',
        refresh_token: '',
        expire_in: 0,
        id_token: '',
        scope: '',
        token_type: '',
    };

    const initUserProfle = {
        email: '',
        veried_email: '',
        family_name: '',
        given_name: '',
        id: '',
        hd: '',
        locale: '',
        name: '',
        picture: '',
    };

    const [user, setUser] = useState(initUserProperties);
    const [isLogin, setIsLogin] = useState<boolean>(false);
    const [userProfile, setUserProfile] = useState<UserProfile>(initUserProfle);
    const authService = AppMgr.getInstance().authService;
    const driveService = AppMgr.getInstance().driveService;
    const loginLogger = logger.child({ module: 'login' });
    const XRPCODES = 'XRPCodes';

    const SCOPE = 'https://mail.google.com https://www.googleapis.com/auth/drive';

    const googleSignIn = useGoogleLogin({
        scope: SCOPE,
        flow: 'auth-code',
        onSuccess: (codeResponse) => {
            if (codeResponse.scope.split(' ').includes('https://mail.google.com/')) {
                setIsLogin(true);
                authService.isLogin = true;
                new Promise<void>((resolve) => {
                    authService.setCode(codeResponse.code);
                    authService.getRefreshToken().then(async (token) => {
                        setUser((prev) => ({
                            ...prev,
                            access_token: token.access_token,
                            refresh_token: token.refresh_token,
                            expire_in: token.expires_in,
                        }));
                        driveService.setAccessToken(token.access_token);
                        // check if XRPCodes folder exists, if not create it
                        try {
                            const folder = await driveService.findFolderByName(XRPCODES);
                            if (!folder) {
                                await driveService.createFolder(XRPCODES);
                            }
                        } catch (error) {
                            loginLogger.error('Error checking or creating XRPCodes folder:', error);
                        }
                    });

                    if (user.refresh_token) {
                        // wait for the refresh token to arrive.
                        resolve();
                    }
                }).then(() => {
                    setTimeout(() => {
                        authService.getAccessToken().then((token) => {
                            loginLogger.debug('Access Token:', token);
                        });
                    }, 1000);
                });
            } else {
                loginLogger.error('please give required permissions to the app.');
            }
        },
        onError: (error) => {
            loginLogger.error('Login Failed:', error);
        },
    });

    /**
     * googleLogut - logout the current Google user
     */
    const googleLogout = () => {
        authService.logOut().then(() => {
            setIsLogin(false);
            authService.userProfile = initUserProfle;
        });
        setUser(initUserProperties);
        setUserProfile(initUserProfle);
        logoutCallback();
    }

    useEffect(() => {
        if (user.access_token && userProfile.email === '') {
            fetch(
                `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`,
                {
                    headers: {
                        Authorization: `Bearer ${user.access_token}`,
                        Accept: 'application/json',
                    },
                },
            )
                .then((res) => res.json())
                .then(async (data) => {
                    setUserProfile(data);
                    authService.userProfile = data;
                    onSuccess(data);
                })
                .catch((err) => loginLogger.error('Error fetching user profile:', err));
        }
    }, [user.access_token, userProfile.email]);

    useEffect(() => {
        if (authService.isLogin) {
            setIsLogin(true);
            setUserProfile(authService.userProfile);
        }
    }, [authService.isLogin, authService.userProfile])

    return (
        <>
            {isLogin && (
                <div className="flex flex-col">
                    <label className="text-mountain-mist-900 dark:text-curious-blue-100">{t('userprofile')}</label>
                    <div className="border-1 flex flex-row items-center gap-2 rounded-md bg-mountain-mist-100 p-2 dark:bg-shark-500">
                        <img
                            className="h-16 w-16 rounded-full"
                            src={userProfile.picture}
                            alt="User Profile"
                        />
                        <div className="flex flex-col">
                            <span className="text-mountain-mist-700 dark:text-mountain-mist-100">{userProfile.name}</span>
                            <span className="text-mountain-mist-700 dark:text-mountain-mist-100">{userProfile.email}</span>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-col items-end gap-2">
                <Button onClicked={isLogin ? googleLogout : googleSignIn}>
                    {isLogin ? t('gooSignOut') : t('gooSignIn')}
                </Button>
            </div>
        </>
    );
}

export default Login;
