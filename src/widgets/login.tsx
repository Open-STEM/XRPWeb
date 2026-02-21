import { useEffect, useState } from 'react';
import AppMgr from '@/managers/appmgr';
import logger from '@/utils/logger';
import { UserProfile } from '@/services/google-auth';
import { useTranslation } from 'react-i18next';
import GoogleLogo from '@assets/images/google-logo.svg';

type LoginProps = {
    logoutCallback: () => void;
    onSuccess: (data: UserProfile) => void;
};

function Login({ logoutCallback, onSuccess }: LoginProps) {
    const { t } = useTranslation();
    
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

    const [isLogin, setIsLogin] = useState<boolean>(false);
    const [userProfile, setUserProfile] = useState<UserProfile>(initUserProfle);
    const authService = AppMgr.getInstance().authService;
    const loginLogger = logger.child({ module: 'login' });

    const googleSignIn = () => {
        loginLogger.info('Initiating Google Sign-In...');
        console.log('Initiating Google Sign-In...');
        authService.initiateGoogleSignIn();
    };

    const googleLogout = () => {
        loginLogger.info('Initiating Google Sign-Out...');
        console.log('Initiating Google Sign-Out...');
        authService.logOut().then(() => {
            setIsLogin(false);
            authService.isLogin = false;
            authService.userProfile = initUserProfle;
            setUserProfile(initUserProfle);
            logoutCallback();
        });
    }

    useEffect(() => {
        loginLogger.info('Login component mounted. Checking user session...');
        console.log('Login component mounted. Checking user session...');
        // On component mount, check if there's an active session with the backend
        const checkUserSession = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/auth/google/user', { credentials: 'include' });
                loginLogger.info(`User session check response: ${response}`);
                console.log('User session check response:', response);
                if (response.ok) {
                    const profile: UserProfile = await response.json();
                    loginLogger.info(`User session active. Profile: ${profile}`);
                    console.log('User session active. Profile:', profile);
                    if (profile && profile.id) {
                        setIsLogin(true);
                        authService.isLogin = true;
                        setUserProfile(profile);
                        authService.userProfile = profile;
                        onSuccess(profile);
                    }
                } else {
                    loginLogger.info(`User session not active or response not ok. Status: ${response.status}`);
                    console.log('User session not active or response not ok. Status:', response.status);
                    setIsLogin(false);
                    authService.isLogin = false;
                }
            } catch (error) {
                loginLogger.error(`Error checking user session: ${error}`);
                console.error('Error checking user session:', error);
                setIsLogin(false);
                authService.isLogin = false;
            }
        };

        checkUserSession();
    }, []);

    return (
        <>
            {isLogin && (
                <div className="flex flex-col">
                    <div className="border-1 flex flex-row items-center gap-1 rounded-md bg-mountain-mist-100 p-1 dark:bg-shark-500">
                        <img
                            className="h-10 w-10 rounded-full"
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
            <div className="flex flex-col items-end gap-1">
                <button 
                    onClick={isLogin ? googleLogout : googleSignIn}
                    className="bg-matisse-600 text-curious-blue-50 hover:bg-matisse-500 dark:bg-shark-600 dark:hover:bg-shark-500 dark:border-shark-500 flex h-10 w-auto items-center rounded-3xl border px-8 py-2 text-lg"
                >
                    <img src={GoogleLogo} className='h-8 w-8' />
                    {isLogin ? t('gooSignOut') : t('gooSignIn')}
                </button>
            </div>
        </>
    );
}

export default Login;
