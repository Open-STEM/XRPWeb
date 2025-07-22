import i18n from '@/utils/i18n';
import { StorageKeys } from '@/utils/localstorage';
import { ListItem, SettingData, ModeType, AdminData } from '@/utils/types';
import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import DialogFooter from '@components/dialogs/dialog-footer';
import Button from '@/widgets/button';
import logger from '@/utils/logger';
import { CommandToXRPMgr } from '@/managers/commandstoxrpmgr';
import { Constants } from '@/utils/constants';
import AppMgr, { EventType } from '@/managers/appmgr';
import Login from '@/widgets/login';
import { UserProfile } from '@/services/google-auth';
import { fireGoogleUserTree, getUsernameFromEmail } from '@/utils/google-utils';

type SettingsProps = {
    /**
     * Indicates if XRPWeb is connected to the XRP Robot
     */
    isXrpConnected: boolean;
    /**
     * Function to toggle the visibility of the dialog
     */
    toggleDialog: () => void;
};

function SettingsDlg({ isXrpConnected, toggleDialog }: SettingsProps) {
    const [xrpUser, setXRPUser] = useState<string>('');
    const [xrpUserList, setXRPUserList] = useState<string[]>([]);
    const [isAddUser, setIsAddUser] = useState<boolean>(false);
    const [username, setUsername] = useState<string>('');
    const [isSelectUser, setIsSelectUser] = useState<boolean>(false);
    const [settings, setSettings] = useState<SettingData | null>(null);
    const [isDisabled, setIsDisabled] = useState<boolean>(true);
    const [isAddButtonDisabled, setIsAddButtonDisabled] = useState<boolean>(false);
    const [isSelectButtonDisabled, setIsSelectButtonDisabled] = useState<boolean>(false);
    const [adminData, setAdminData] = useState<AdminData | undefined>(undefined);
    const [modeValue, setModeValue] = useLocalStorage(StorageKeys.MODESETTING, -1);
    const [isValidUsername, setIsValidUsername] = useState<boolean | null>(null);
    const [, setLSXrpUser] = useLocalStorage(StorageKeys.XRPUSER, '');
    const modeLogger = logger.child({ module: 'modes' });

    const authService = AppMgr.getInstance().authService;
    const USERS = '/users/';
    const adminFilePath = '/' + Constants.ADMIN_FILE;

    const modeOptions: ListItem[] = [
        {
            label: i18n.t('sysmode'),
            image: '',
        },
        {
            label: i18n.t('usermode'),
            image: '',
        },
        {
            label: i18n.t('goousermode'),
            image: '',
        },
    ];

    /**
     * validateUsername
     *
     * @description
     * Validates the username against the specified regex pattern.
     * The pattern requires the username to start with a letter and be
     * between 5 and 12 characters long, allowing letters, numbers,
     * dashes, and underscores.
     *
     * @param {string} username - The username to validate.
     * @returns {boolean} - Returns true if the username is valid, otherwise false.
     */
    const validateUsername = (username: string): boolean => {
        const regex = /^[A-z][A-z0-9-_]{4,11}$/;
        return regex.test(username);
    };

    /**
     * getAdminData - fetches the admin data from the XRP Robot
     * and updates the state accordingly.
     */
    const getAdminData = async () => {
        if (isXrpConnected) {
            try {
                if (adminData === undefined) {
                    await CommandToXRPMgr.getInstance()
                        .getFileContents(adminFilePath)
                        .then((data) => {
                            if (data.length > 0) {
                                const json = new TextDecoder().decode(new Uint8Array(data));
                                const adminData = JSON.parse(json) as AdminData;
                                setAdminData(adminData);
                                setModeValue(adminData.mode);
                                setSettings({
                                    mode: adminData.mode,
                                });
                                if (
                                    authService.isAdmin ||
                                    authService.userProfile.email === adminData.email
                                ) {
                                    setIsDisabled(false);
                                }
                            } else {
                                setModeValue(ModeType.SYSTEM);
                                setSettings({
                                    mode: ModeType.SYSTEM,
                                });
                            }
                        });
                }
            } catch (error) {
                modeLogger.error('Error fetching admin data:', error);
            }
        } else {
            setModeValue(ModeType.GOOUSER);
            setSettings({ mode: ModeType.GOOUSER});
        }
    };

    /**
     * handleModeSelection - save the selection in state
     * @param event
     */
    const handleModeSelection = (event: { target: { value: string } }) => {
        const mode = parseInt(event.target.value);
        setSettings({ mode: mode });

        switch (mode) {
            case ModeType.SYSTEM:
                setModeValue(ModeType.SYSTEM);
                if (isXrpConnected) {
                    CommandToXRPMgr.getInstance().getOnBoardFSTree();
                }
                break;
            case ModeType.USER:
                setModeValue(ModeType.USER);
                break;
            case ModeType.GOOUSER:
                {
                    setModeValue(ModeType.GOOUSER);
                    if (authService.isLogin) {
                        const username = getUsernameFromEmail(authService.userProfile.email);
                        fireGoogleUserTree(username ?? '');
                    }
                }
                break;
        }
    };

    /**
     * handleSave - saving the settings into localstorage
     */
    const handleSave = async () => {
        if (adminData !== undefined) {
            adminData.mode = settings?.mode ?? ModeType.SYSTEM;
            await CommandToXRPMgr.getInstance().uploadFile(
                adminFilePath,
                JSON.stringify(adminData),
            );
        }
        setModeValue(settings?.mode ?? -1);
        setLSXrpUser(xrpUser);
        toggleDialog();
    };

    /**
     * selectValue - returns the model type based on the label
     * @param optionLabel
     * @returns the model type based on the label
     */
    const selectValue = (optionLabel: string): number => {
        switch (optionLabel) {
            case i18n.t('sysmode'):
                return ModeType.SYSTEM;
            case i18n.t('usermode'):
                return ModeType.USER;
            case i18n.t('goousermode'):
                return ModeType.GOOUSER;
            default:
                return ModeType.SYSTEM;
        }
    };

    /**
     * selectLabel - returns the mode label based on the mode type
     * @param mode
     * @returns the mode label based on the mode type
     */
    const selectLabel = (mode: number): string => {
        switch (mode) {
            case ModeType.SYSTEM:
                return i18n.t('sysmode');
            case ModeType.USER:
                return i18n.t('usermode');
            case ModeType.GOOUSER:
                return i18n.t('goousermode');
            default:
                return i18n.t('sysmode');
        }
    };

    /**
     * process the user user name input from user
     * @param e - event argument
     */
    const handleAddUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUsername = e.target.value;
        setUsername(newUsername);
        setIsValidUsername(validateUsername(newUsername));
    };

    /**
     * googleSignOut - signs out the user from Google
     * and updates the state accordingly.
     */
    const googleSignOut = () => {
        setIsDisabled(true);
        if (modeValue === ModeType.GOOUSER) {
            AppMgr.getInstance().emit(EventType.EVENT_FILESYS, '{}');
        }
    };

    /**
     * addUser - adds a new user to the XRP Robot
     * and updates the state accordingly.
     */
    const addUser = async () => {
        if (!isAddUser) {
            setIsAddUser(true);
            setIsSelectButtonDisabled(true);
        } else {
            setIsAddUser(false);
            setIsSelectButtonDisabled(false);
            if (username.length > 0) {
                setXRPUserList((prev) => [...prev, username]);
                setXRPUser(username);
                // create a folder for this user in the XRP Robot
                await CommandToXRPMgr.getInstance().buildPath(USERS + username);
                await CommandToXRPMgr.getInstance().getOnBoardFSTree();
                setUsername('');
            } else {
                modeLogger.error('Username cannot be empty');
            }
        }
    };

    /**
     * selectUser - toggles the user selection state
     * and fetches the list of users from the XRP Robot.
     */
    const selectUser = async () => {
        if (!isSelectUser) {
            setIsSelectUser(true);
            setIsAddButtonDisabled(true);
            if (isXrpConnected) {
                await CommandToXRPMgr.getInstance().getOnBoardFSTree();
                const userList = AppMgr.getInstance().getUserFolderList();
                setXRPUserList(userList?.map((folder) => folder.name) ?? []);
            }
        } else {
            setIsSelectUser(false);
            setIsAddButtonDisabled(false);
        }
    };

    /**
     * a handler for the selection of a user from the dropdown
     * @param e - event argument
     * @description handles the selection of a user from the dropdown
     */
    const handleSelectUserOption = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedUser = e.target.value;
        setXRPUser(selectedUser);
        setLSXrpUser(selectedUser);

        if (isXrpConnected) {
            await CommandToXRPMgr.getInstance().getOnBoardFSTree();
        }
    };

    const onLoginSuccess = async (data: UserProfile) => {
        const username = getUsernameFromEmail(data.email);
        if (username !== undefined) {
            setXRPUser(username ?? '');
            if (isXrpConnected)
                await CommandToXRPMgr.getInstance().buildPath(Constants.GUSERS_FOLDER + username);
        }
        if (isXrpConnected) {
            if (adminData === undefined) {
                const content = JSON.stringify({
                    name: data.name,
                    email: data.email,
                    mode: ModeType.GOOUSER,
                });
                setAdminData(adminData);
                setIsDisabled(false);
                await CommandToXRPMgr.getInstance().uploadFile(
                    adminFilePath,
                    content?.toString() ?? '',
                );
            } else {
                if (data.email === adminData.email) {
                    setIsDisabled(false);
                }
            }
        }
        if (modeValue === ModeType.GOOUSER) {
            fireGoogleUserTree(username ?? '');
        }
    };

    useEffect(() => {
        getAdminData();
    }, []);

    return (
        <div className="flex flex-col items-center gap-4 rounded-md border border-mountain-mist-700 p-8 shadow-md transition-all dark:border-shark-500 dark:bg-shark-950">
            <div className="flex w-[80%] flex-col items-center">
                <h1 className="text-lg font-bold text-mountain-mist-700">{i18n.t('settings')}</h1>
                <p className="text-sm text-mountain-mist-700">{i18n.t('settingDescription')}</p>
            </div>
            <hr className="w-full border-mountain-mist-600" />
            <div className="flex w-full flex-col gap-2">
                <label className="text-mountain-mist-900 dark:text-curious-blue-100">{i18n.t('user-modes')}</label>
                <select
                    id="modeSelectedId"
                    className="dark:text-white block rounded border border-s-2 border-shark-300 border-s-curious-blue-500 bg-mountain-mist-100 p-2.5 text-sm text-mountain-mist-700 focus:border-mountain-mist-500 focus:ring-curious-blue-500 dark:border-shark-600 dark:border-s-shark-500 dark:bg-shark-500 dark:text-mountain-mist-200 dark:placeholder-mountain-mist-400 dark:focus:border-matisse-500 dark:focus:ring-shark-300"
                    onChange={handleModeSelection}
                    disabled={isDisabled}
                >
                    <option defaultValue={modeValue}>{selectLabel(modeValue)}</option>
                    {modeOptions.map((option) => (
                        <option key={option.label} value={selectValue(option.label)}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {settings?.mode === ModeType.USER && isXrpConnected && (
                    <>
                        {isAddUser && (
                            <div className="flex flex-col gap-2">
                                <label className="text-mountain-mist-900 dark:text-curious-blue-100">
                                    {i18n.t('addusername')}
                                </label>
                                <input
                                    className="text-md rounded border border-shark-300 p-2 text-mountain-mist-700 dark:border-shark-600 dark:bg-shark-500 dark:text-mountain-mist-200 dark:placeholder-mountain-mist-400"
                                    type="username"
                                    placeholder={i18n.t('username')}
                                    value={username}
                                    required
                                    onChange={handleAddUserInput}
                                    minLength={12}
                                />
                                {isValidUsername == null ? null : isValidUsername ? (
                                    <label className='text-chateau-green-600 dark:text-green-400'>{i18n.t('valid-username')}</label>
                                ) : (
                                    <label className='text-cinnabar-600 dark:text-red-400'>{i18n.t('invalid-username')}</label>
                                )}
                            </div>
                        )}
                        {isSelectUser && (
                            <div className="flex flex-col gap-2">
                                <label className="text-mountain-mist-900 dark:text-curious-blue-100">{i18n.t('users')}</label>
                                <select
                                    id="selectUser"
                                    className="dark:text-white block rounded border border-s-2 border-shark-300 border-s-curious-blue-500 bg-mountain-mist-100 p-2.5 text-sm text-mountain-mist-700 focus:border-mountain-mist-500 focus:ring-curious-blue-500 dark:border-shark-600 dark:border-s-shark-500 dark:bg-shark-500 dark:text-mountain-mist-200 dark:placeholder-mountain-mist-400 dark:focus:border-matisse-500 dark:focus:ring-shark-300"
                                    onChange={handleSelectUserOption}
                                >
                                    <option value="">{i18n.t('selectUserOption')}</option>
                                    {xrpUserList.map((user, index) => (
                                        <option key={index} value={user}>
                                            {user}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex flex-col items-end">
                            <div className="flex flex-row gap-2">
                                <Button disabled={isAddButtonDisabled} onClicked={addUser}>
                                    {i18n.t('addUser')}
                                </Button>
                                <Button disabled={isSelectButtonDisabled} onClicked={selectUser}>
                                    {i18n.t('selectUser')}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
                <Login onSuccess={onLoginSuccess} logoutCallback={googleSignOut} />
            </div>
            <hr className="w-full border-mountain-mist-600" />
            <DialogFooter
                btnAcceptLabel={i18n.t('save')}
                btnAcceptCallback={handleSave}
                btnCancelCallback={toggleDialog}
            />
        </div>
    );
}

export default SettingsDlg;
