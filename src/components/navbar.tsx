import logo from '@assets/images/xrpstickerbot.png';
import fileadd from '@assets/images/file_add.svg';
import fileupload from '@assets/images/upload_file.svg';
import fileexport from '@assets/images/fileexport.svg';
import filesave from '@assets/images/file_save.svg';
import filesaveas from '@assets/images/save_as.svg';
import fontplus from '@assets/images/text_increase.svg';
import fontminus from '@assets/images/text_decrease.svg';
import userguide from '@assets/images/developer_guide.svg';
import apilink from '@assets/images/api.svg';
import python from '@assets/images/python.svg';
import convert from '@assets/images/convert.svg';
import dashboard from '@assets/images/dashboard.svg';
import drivers from '@assets/images/drivers.svg';
import forum from '@assets/images/forum.svg';
import cirriculum from '@assets/images/cirriculum.svg';
import changelog from '@assets/images/changelog.svg';
import settings from '@assets/images/settings.svg';
import chatbot from '@assets/images/chatbot.svg';
import gamepad from'@assets/images/gamepad.svg';
import { TiArrowSortedDown } from 'react-icons/ti';
import { IoPlaySharp } from 'react-icons/io5';
import { MdMoreVert } from "react-icons/md";
import { IoStop } from 'react-icons/io5';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@components/dialogs/dialog';
import ConnectionDlg from '@/components/dialogs/connectiondlg';
import FileSaveAsDialg from '@/components/dialogs/filesaveasdlg';
import {
    ConnectionType,
    ConnectionCMD,
    NewFileData,
    FileType,
    FileData,
    EditorType,
    FontSize,
    ModeType,
} from '@/utils/types';
import { useFilePicker } from 'use-file-picker';
import { MenuDataItem } from '@/widgets/menutypes';
import MenuItem from '@/widgets/menu';
import AppMgr, { EventType, LoginStatus } from '@/managers/appmgr';
import { ConnectionState } from '@/connections/connection';
import SettingsDlg from '@/components/dialogs/settings';
import NewFileDlg from '@/components/dialogs/newfiledlg';
import { Constants } from '@/utils/constants';
import { CommandToXRPMgr } from '@/managers/commandstoxrpmgr';
import UploadFileDlg from '@/components/dialogs/uploadfiledlg';
import EditorMgr, { EditorSession } from '@/managers/editormgr';
import { useLocalStorage } from 'usehooks-ts';
import { StorageKeys } from '@/utils/localstorage';
import FileSaver from 'file-saver';
import PowerSwitchAlert from '@/components/dialogs/power-switchdlg';
import ViewPythonDlg from '@/components/dialogs/view-pythondlg';
import AlertDialog from '@/components/dialogs/alertdlg';
import BatteryBadDlg from '@/components/dialogs/battery-baddlg';
import ProgressDlg from '@/components/dialogs/progressdlg';
import ConfirmationDlg from '@components/dialogs/confirmdlg';
import UpdateDlg from '@components/dialogs/updatedlg';
import React from 'react';
import { CreateEditorTab } from '@/utils/editorUtils';
import ChangeLogDlg from '@components/dialogs/changelog';
import { Actions, IJsonTabNode } from 'flexlayout-react';
import GoogleLoginDlg from '@components/dialogs/logindlg';
import { fireGoogleUserTree, getUsernameFromEmail } from '@/utils/google-utils';
import XRPDriverInstallDlg from './dialogs/driver-installs';
import powerswitch_standard from '@assets/images/XRP-nonbeta-controller-power.jpg';
import powerswitch_beta from '@assets/images/XRP_Controller-Power.jpg';

type NavBarProps = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layoutref: any;
};

let hasSubscribed = false;

/**
 * NavBar component - create the navigation bar
 * @param layoutref
 * @returns
 */
function NavBar({ layoutref }: NavBarProps) {
    const { t } = useTranslation();
    const [isMoreMenuOpen, setMoreMenuOpen] = useState(false);
    const [isConnected, setConnected] = useState(false);
    const [isLogin, setLogin] = useState(false);
    const [isRunning, setRunning] = useState(false);
    const [isBlockly, setBlockly] = useState(false);
    const [isOtherTab, setIsOtherTab] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [isDlgOpen, setDlgOpen] = useState(false);
    const [isGamepadConnected, setGamepadConnected] = useState<boolean>(false);
    const [dialogContent, setDialogContent] = useState<React.ReactNode>(null);
    const { openFilePicker, loading, errors } = useFilePicker({
        multiple: true,
        accept: ['.py', '.blocks'],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onFilesSuccessfullySelected: (data: any) => {
            console.log(data.plainFiles);
            const fileData: FileData[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.filesContent.forEach((content: any) => {
                console.log(content.path);
                fileData.push({ name: content.path, content: content.content });
            });
            setDialogContent(<UploadFileDlg files={fileData} toggleDialog={toggleDialog} />);
            setDlgOpen(true);
        },
    });
    const [xprID, setXrpId] = useState<{ platform?: string; XRPID?: string } | null>(null);
    const [activeTab, setActiveTab] = useLocalStorage(StorageKeys.ACTIVETAB, '');
    const authService = AppMgr.getInstance().authService;
    const driveService = AppMgr.getInstance().driveService;
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!hasSubscribed) {
            // subscribe to the connection event
            AppMgr.getInstance().on(EventType.EVENT_CONNECTION_STATUS, async (state: string) => {
                if (state === ConnectionState.Connected.toString()) {
                    setConnected(true);
                    setRunning(false);
                    processModeChange(authService.modeSettings);
                } else if (state === ConnectionState.Disconnected.toString()) {
                    setConnected(false);
                    setXrpId(null);
                }
            });

            AppMgr.getInstance().on(EventType.EVENT_ID, (id: string) => {
                setXrpId(JSON.parse(id));
            });

            AppMgr.getInstance().on(EventType.EVENT_EDITOR, (type: EditorType) => {
                if (type === EditorType.BLOCKLY) {
                    setBlockly(true);
                    setIsOtherTab(false);
                } else if (type === EditorType.PYTHON) {
                    setBlockly(false);
                    setIsOtherTab(false);
                } else {
                    setIsOtherTab(true);
                }
            });

            AppMgr.getInstance().on(EventType.EVENT_OPEN_FILE, async (filePathDataJson: string) => {
                const filePathData = JSON.parse(filePathDataJson);
                const filename = filePathData.xrpPath.split('/').pop();
                if (filename && EditorMgr.getInstance().hasEditorSession(filename)) {
                    EditorMgr.getInstance().SelectEditorTab(filename);
                    return;
                }
                const fileType = filename?.includes('.blocks') ? FileType.BLOCKLY : FileType.PYTHON;
                const fileData: NewFileData = {
                    parentId: '',
                    path: filePathData.xrpPath,
                    gpath: filePathData.gPath,
                    name: filename || '',
                    filetype: fileType,
                };
                CreateEditorTab(fileData, layoutref);
                setActiveTab(fileData.name)
                // Need to access the connection status directly from the manager because the React isConnected state available 
                // isn't available in the thread context
                const isConnected = AppMgr.getInstance().getConnection()?.isConnected();
                if (authService.isLogin && authService.modeSettings === ModeType.GOOUSER) {
                    // get the content from Google Drive
                    loadGoogleEditor(filePathData, fileType, filename);
                } else if (isConnected) {
                    await CommandToXRPMgr.getInstance()
                        .getFileContents(filePathData.xrpPath)
                        .then((content) => {
                            loadXRPEditor(content, fileType, filename);
                        });
                } 
            });

            AppMgr.getInstance().on(EventType.EVENT_MICROPYTHON_UPDATE, (versions) => {
                setDialogContent(<UpdateDlg updateCallback={handleMPUpdateCallback} toggleDialog={toggleDialog} isUpdateMP={true} isUpdateLib={false} mpVersion={JSON.parse(versions)}/>);
                toggleDialog();
            });

            AppMgr.getInstance().on(EventType.EVENT_XRPLIB_UPDATE, (versions) => {
                setDialogContent(<UpdateDlg updateCallback={handleXRPLibUpdateCallback} toggleDialog={toggleDialog} isUpdateMP={false} isUpdateLib={true} xrpVersion={JSON.parse(versions)}/>);
                toggleDialog();
            });

            AppMgr.getInstance().on(EventType.EVENT_MUST_UPDATE_MICROPYTHON, () => {
                window.alert("must update MP");
                //setDialogContent(<ChangeLogDlg closeDialog={toggleDialog}/>);
                //toggleDialog();
            });

            AppMgr.getInstance().on(EventType.EVENT_SHOWCHANGELOG, (changelog) => {
                if (changelog === Constants.SHOW_CHANGELOG) {
                    setDialogContent(<ChangeLogDlg closeDialog={toggleDialog}/>);
                    toggleDialog();
                }
            });

            AppMgr.getInstance().on(EventType.EVENT_SHOWPROGRESS, (progress) => {
                if (progress === Constants.SHOW_PROGRESS) {
                    setDialogContent(<ProgressDlg title='saveToXRPTitle'/>);
                    toggleDialog();
                    AppMgr.getInstance().on(EventType.EVENT_UPLOAD_DONE, () => {
                        toggleDialog();
                        AppMgr.getInstance().eventOff(EventType.EVENT_UPLOAD_DONE);
                        setDialogContent(<div />);
                    });
                }
            });

            AppMgr.getInstance().on(EventType.EVENT_ALERT, (message) => {
                setDialogContent(<AlertDialog alertMessage={message} toggleDialog={toggleDialog} />);
                toggleDialog();
            });

            AppMgr.getInstance().on(EventType.EVENT_GAMEPAD_STATUS, (status: string) => {
                if (status === Constants.CONNECTED) {
                        setGamepadConnected(true)
                } else if (status === Constants.DISCONNECTED) {
                    setGamepadConnected(false);
                }
            });

            AppMgr.getInstance().on(EventType.EVENT_LOGIN_STATUS, (status: string) => {
                if (status === LoginStatus.LOGGED_IN) {
                    setLogin(true);
                } else if (status === LoginStatus.LOGGED_OUT) {
                    setLogin(false);
                }
            });

            hasSubscribed = true;
        }
    });

    /**
     * toggleMoreDropdown - toggle the more dropdown menu when the mouse click outside the menu
     */
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            // Check if the click is outside the dropdown menu
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setMoreMenuOpen(false);
            }
        }

        // Add event listener when the component mounts
        document.addEventListener('mousedown', handleClickOutside);

        // Clean up the event listener when the component unmounts
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (errors.length > 0) {
        return <div>Error: {errors.values.toString()}</div>;
    }

    /**
     * loadGoogleEditor - load the file content from Google Drive into the editor
     * @param filePathData 
     * @param fileType 
     * @param filename 
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function loadGoogleEditor(filePathData: any, fileType: FileType, filename: any) {
        driveService.getFileContents(filePathData.gPath).then((fileContent) => {
            let content;
            if (fileType === FileType.BLOCKLY) {
                content = fileContent?.split('##XRPBLOCKS ').at(1);
            } else {
                content = fileContent;
            }
            const loadContent = { name: filename, content: content };
            AppMgr.getInstance().emit(EventType.EVENT_EDITOR_LOAD, JSON.stringify(loadContent));
        });
    }

    /**
     * loadXRPEditor - load the file content from XRP into the editor
     * @param content 
     * @param fileType 
     * @param filename 
     */
    function loadXRPEditor(content: number[], fileType: FileType, filename: string) {
        // if the file is a block files, extract the blockly JSON out of the comment ##XRPBLOCKS
        let bytes = content;
        if (fileType === FileType.BLOCKLY) {
            const data: string = new TextDecoder().decode(new Uint8Array(bytes));
            const lines: string[] = data.split('##XRPBLOCKS ');
            bytes = Array.from(new TextEncoder().encode(lines.slice(-1)[0]));
        }
        const text = typeof bytes === 'string'
            ? bytes
            : new TextDecoder().decode(new Uint8Array(bytes));
        // set the content in the editor
        const loadContent = { name: filename, content: text };
        AppMgr.getInstance().emit(EventType.EVENT_EDITOR_LOAD, JSON.stringify(loadContent));
    }

    /**
     * processModeChange - perform various function base on mode
     * @param mode 
     */
    function processModeChange(mode: number | undefined) {
        if (mode === ModeType.GOOUSER) {
            if (!AppMgr.getInstance().authService.isLogin) {
                setDialogContent(<GoogleLoginDlg toggleDialog={toggleDialog}></GoogleLoginDlg>);
                toggleDialog();
            } else if (AppMgr.getInstance().authService.isLogin) {
                const username = getUsernameFromEmail(AppMgr.getInstance().authService.userProfile.email);
                fireGoogleUserTree(username ?? '');
            }
        } else if (mode === ModeType.USER) {
            // check if there is an active user in localstorage
            const user = localStorage.getItem(StorageKeys.XRPUSER)?.replace(/"/g, '');
            if (user === undefined || user === "") {
                // output an alert message and inform the user
                setDialogContent(<AlertDialog alertMessage={t('no-user-message')} toggleDialog={toggleDialog} />);
                toggleDialog();
            }
        }
    }

    /**
     * handleMPUpdateCallback - handle the MicroPython update callback
     */
    function handleMPUpdateCallback() {
        // ask the user to confirm the update and provide instructions to the user about the update
        const xrpDrive = CommandToXRPMgr.getInstance().getXRPDrive();
        setDialogContent(<ConfirmationDlg acceptCallback={handleMPUpdateConfirmed} toggleDialog={toggleDialog} confirmationMessage={t('update-mp-instructions', { drive: xrpDrive })} />);
        toggleDialog();
    }

    /**
     * handleMPUpdateConfirmed - handle the MicroPython update confirmed
     * update is confirmed by the user, start the update process
     */
    async function handleMPUpdateConfirmed() {
        toggleDialog();
        // await CommandToXRPMgr.getInstance().updateMicroPython();
        let writable: FileSystemWritableFileStream;
        try {
            setDialogContent(<ProgressDlg title='mpUpdateTitle'/>);
            toggleDialog();
            await CommandToXRPMgr.getInstance().enterBootSelect();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const dirHandle = await (window as any).showDirectoryPicker();
            // await CommandToXRPMgr.getInstance().updateMicroPython(dirHandle);
            const fileHandle = await dirHandle?.getFileHandle("firmware.uf2", { create: true });
            writable = await fileHandle!.createWritable();
            const firmwareFilename = CommandToXRPMgr.getInstance().getXRPDrive() === Constants.XRP_PROCESSOR_BETA ? "firmware2040.uf2" : "firmware2350.uf2";
            AppMgr.getInstance().emit(EventType.EVENT_PROGRESS, '10');
            const data = await (await fetch("micropython/" + firmwareFilename)).arrayBuffer();
            await writable.write(data);
            AppMgr.getInstance().emit(EventType.EVENT_PROGRESS, '100');
            await writable.close();
        } catch(err) {
            console.log("Firmware update error: ", err);
            setDialogContent(<AlertDialog alertMessage={t('update-mp-error', { error: err})} toggleDialog={toggleDialog} />);
            toggleDialog();
        }
        setDialogContent(<AlertDialog alertMessage={t('update-mp-complete')} toggleDialog={toggleDialog} />);
        toggleDialog();
    }

    /**
     * handleXRPLibUpdateCallback - handle the XRPLib update callback
     */
    async function handleXRPLibUpdateCallback() {
        // ask the user to confirm the update and provide instructions to the user about the update
        const xrpDrive = CommandToXRPMgr.getInstance().getXRPDrive();
        setDialogContent(<ConfirmationDlg acceptCallback={handleXRPLibUpdateConfirmed} toggleDialog={toggleDialog} confirmationMessage={t('update-lib-instructions', { drive: xrpDrive })} />);
        toggleDialog();
    }

    /**
     * handleXRPLibUpdateConfirmed - handle the XRPLib update confirmed
     */
    async function handleXRPLibUpdateConfirmed() {
        toggleDialog();
        try {
            setDialogContent(<ProgressDlg title='xrpLibUpdateTitle'/>);
            toggleDialog();
            await CommandToXRPMgr.getInstance().updateLibrary();
        } catch (err) {
            console.log("Library update error: ", err);
            setDialogContent(<AlertDialog alertMessage={t('update-lib-error', { error: err})} toggleDialog={toggleDialog} />);
            toggleDialog();
        }
        toggleDialog();
        setDialogContent(<AlertDialog alertMessage={t('update-lib-complete')} toggleDialog={toggleDialog} />);
        toggleDialog();
    }

    /**
     * onNewFileSubmitted - get the form data and create a new file on the layout
     */
    async function onNewFileSubmitted(data: NewFileData) {
        CreateEditorTab(data, layoutref);
        setActiveTab(data.name);
        if (authService.isLogin) {
            // create the file in Google Drive
            const minetype = data.name.includes('.py')
                        ? 'text/x-python' : data.name.includes('.blocks')
                        ? 'application/json' : 'text/plain';
            const blob = new Blob([''], { type: minetype });
            await driveService.uploadFile(blob, data.name, minetype, data.parentId ?? undefined).then((file) => {
                console.log('New file created in Google Drive: ', file);
                // update the file ID in the editor session
                const editorMgr = EditorMgr.getInstance();
                const session = editorMgr.getEditorSession(data.name);
                if (session) {
                    session.gpath = file?.id;
                }
            });
            await fireGoogleUserTree(getUsernameFromEmail(authService.userProfile.email) ?? '');
        } 
        
        if (isConnected) {
            // create the file in XRP
            await CommandToXRPMgr.getInstance()
                .uploadFile(data.path, '')
                .then(() => {
                    CommandToXRPMgr.getInstance().getOnBoardFSTree();
                });
        }
        toggleDialog();
    }

    /**
     * NewFile - create either a new Python or Blockly file
     */
    function NewFile() {
        console.log(t('newFile'), layoutref);
        setDialogContent(
            <NewFileDlg submitCallback={onNewFileSubmitted} toggleDialog={toggleDialog} />,
        );
        toggleDialog();
    }

    /**
     * UploadFile - upload a file to XRP
     */
    function UploadFile() {
        console.log(t('uploadFile'));
        openFilePicker();
    }

    /**
     * ExportToPC - export the file to PC
     */
    function ExportToPC() {
        console.log(t('exportToPC'));
        const session = EditorMgr.getInstance().getEditorSession(activeTab);
        if (session) {
            CommandToXRPMgr.getInstance()
                .getFileContents(session.path)
                .then((content) => {
                    const data: string = new TextDecoder().decode(new Uint8Array(content));
                    const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
                    FileSaver.saveAs(blob, session.id);
                });
        } else {
            setDialogContent(
                <AlertDialog alertMessage={t('no-activetab')} toggleDialog={toggleDialog} />,
            );
            toggleDialog();
        }
    }

    /**
     * SaveFile - Save file to XRP
     */
    function SaveFile() {
        console.log(t('saveFile'));
        if (EditorMgr.getInstance().hasEditorSession(activeTab)) {
            AppMgr.getInstance().emit(EventType.EVENT_SAVE_EDITOR, '');
            setDialogContent(<ProgressDlg title='saveToXRPTitle'/>);
            AppMgr.getInstance().on(EventType.EVENT_UPLOAD_DONE, () => {
                toggleDialog();
                AppMgr.getInstance().eventOff(EventType.EVENT_UPLOAD_DONE);
                setDialogContent(<div />);
            });
        } else {
            setDialogContent(
                <AlertDialog alertMessage={t('no-activetab')} toggleDialog={toggleDialog} />,
            );
        }
        toggleDialog();
    }

    /**
     * hanleSaveFileAs
     * @param fileData
     */
    function handleSaveFileAs(fileData: NewFileData) {
        // close the save as dialog first
        const editorMgr = EditorMgr.getInstance();
        const session = editorMgr.getEditorSession(activeTab);
        // close the save as dialog first
        toggleDialog();
        if (session) {
            session.path = fileData.path + '/' + fileData.name;
            AppMgr.getInstance().emit(EventType.EVENT_SAVE_EDITOR, '');
            // start the progress dialog
            setDialogContent(<ProgressDlg title='saveToXRPTitle'/>);
            toggleDialog();
            // subscribe to the UploadFile complete event
            AppMgr.getInstance().on(EventType.EVENT_UPLOAD_DONE, async () => {
                AppMgr.getInstance().eventOff(EventType.EVENT_UPLOAD_DONE);
                // close the current tab and re-open a new tab for the new file
                editorMgr.RemoveEditorTab(activeTab);
                editorMgr.RemoveEditor(activeTab);
                const newFileData: NewFileData = {
                    parentId: '',
                    path: fileData.path + '/' + fileData.name,
                    gpath: fileData.gpath + '/' + fileData.name,
                    name: fileData.name || '',
                    filetype: session.type === EditorType.BLOCKLY ? FileType.BLOCKLY : FileType.PYTHON,
                };
                CreateEditorTab(newFileData, layoutref);
                setActiveTab(fileData.name)
                setDialogContent(<div />);
                await CommandToXRPMgr.getInstance().getOnBoardFSTree();
                if (authService.isLogin) {
                    loadGoogleEditor(newFileData, newFileData.filetype, newFileData.name);
                } else if (isConnected) {
                    CommandToXRPMgr.getInstance().getFileContents(newFileData.path).then((content) => {
                        loadXRPEditor(content, newFileData.filetype, newFileData.name);
                    });
                }
            });
            toggleDialog();
        }
    }

    /**
     * SaveFileAs - save the current file as to the XRP
     */
    function SaveFileAs() {
        console.log(t('saveFileAs'));
        if (EditorMgr.getInstance().hasEditorSession(activeTab)) {
            setDialogContent(
                <FileSaveAsDialg
                    saveCallback={handleSaveFileAs}
                    toggleDialog={toggleDialog}
                />,
            );
            toggleDialog();
        } else {
            setDialogContent(
                <AlertDialog alertMessage={t('no-activetab')} toggleDialog={toggleDialog} />,
            );
            toggleDialog();
        }
    }

    /**
     * ViewPythonFile - view the Python file
     */
    function ViewPythonFile() {
        console.log('View Python File', activeTab);
        if (isOtherTab) {
            return;
        }
        const viewPythonHandler = (code: string) => {
            setDialogContent(<ViewPythonDlg code={code} toggleDlg={toggleDialog} clearDlg={clearDialogContent}/>);
            toggleDialog();
            appMgr.eventOff(EventType.EVENT_GENPYTHON_DONE);
        };
        const appMgr = AppMgr.getInstance();
        // signal the editor to generate the python content in this editor session
        appMgr.on(EventType.EVENT_GENPYTHON_DONE, viewPythonHandler);
        appMgr.emit(EventType.EVENT_GENPYTHON, activeTab);
    }

    /**
     * BlocksToPythonCallback - setup the conversion of the current active Blocks program to Python program
     */
    const BlocksToPythonCallback = () => {
        const convertToPythonHandler = async (code: string) => {
            // remove the active tab and create a new python editor tab with the code
            const editorSession = EditorMgr.getInstance().getEditorSession(activeTab);
            if (editorSession) {
                const fileData: NewFileData = {
                    parentId: '',
                    path: editorSession?.path,
                    name: editorSession.id.split('.blocks')[0] + '.py',
                    filetype: FileType.PYTHON,
                    content: code,
                };
                // move the converted blockly file to /trash
                await CommandToXRPMgr.getInstance().renameFile(
                    editorSession.path,
                    Constants.TRASH_FOLDER + '/' + editorSession.id,
                ).then(async () => {
                    // save the file to python
                    const path = editorSession.path.split('.blocks')[0] + '.py';
                    await CommandToXRPMgr.getInstance().uploadFile(path, code).then(() => {
                        EditorMgr.getInstance().RemoveEditor(activeTab);
                        CreateEditorTab(fileData, layoutref);
                        setActiveTab(fileData.name);
                    });
                    await CommandToXRPMgr.getInstance().getFileContents(path).then((content) => {
                        // if the file is a block files, extract the blockly JSON out of the comment ##XRPBLOCKS
                        const text = new TextDecoder().decode(new Uint8Array(content));
                        const loadContent = { name: fileData.name, content: text };
                        AppMgr.getInstance().emit(EventType.EVENT_EDITOR_LOAD, JSON.stringify(loadContent));
                    })
                });
            }
            EditorMgr.getInstance().RemoveEditorTab(activeTab);
            appMgr.eventOff(EventType.EVENT_GENPYTHON_DONE);
        };
        const appMgr = AppMgr.getInstance();
        // signal the editor to generate the python content in this editor session
        appMgr.on(EventType.EVENT_GENPYTHON_DONE, convertToPythonHandler);
        appMgr.emit(EventType.EVENT_GENPYTHON, activeTab);
        toggleDialog();
    };

    /**
     * ConvertToPython - convert the current blockly file to Python
     */
    function ConvertToPython() {
        if (isOtherTab) {
            return;
        }
        if (!isConnected) {
            setDialogContent(
                <AlertDialog
                    alertMessage={t('XRP-not-connected')}
                    toggleDialog={toggleDialog}
                />,
            );
            toggleDialog();
            return;
        }
        setDialogContent(
            <ConfirmationDlg
                acceptCallback={BlocksToPythonCallback}
                toggleDialog={toggleDialog}
                confirmationMessage={t('convert-to-python-desc')}
            />,
        );
        toggleDialog();
    }

    /**
     * FontPlusPlus - increase font in the current window
     */
    function FontPlusPlus() {
        console.log(t('increaseFont'));
        if (isOtherTab) {
            return;
        }
        AppMgr.getInstance().emit(EventType.EVENT_FONTCHANGE, FontSize.INCREASE);
    }

    /**
     * FontMinus - decrease font in the current window
     */
    function FontMinus() {
        console.log(t('decreaseFont'));
        if (isOtherTab) {
            return;
        }
        AppMgr.getInstance().emit(EventType.EVENT_FONTCHANGE, FontSize.DESCREASE);
    }

    /**
     * viewDashboard - view the dashboard
     */
    function viewDashboard() {
        console.log(t('dashboard'));
        // check if the dashboard tab is already open
        if (EditorMgr.getInstance().hasEditorSession(Constants.DASHBOARD_TAB_ID)) {
            const layoutModel = EditorMgr.getInstance().getLayoutModel();
            layoutModel?.doAction(Actions.selectTab(Constants.DASHBOARD_TAB_ID));
            return;
        }
        const tabInfo: IJsonTabNode = {
            component: 'dashboard',
            name: t('dashboard'),
            id: Constants.DASHBOARD_TAB_ID,
            helpText: t('dashboard')
        };
        layoutref!.current?.addTabToTabSet(Constants.EDITOR_TABSET_ID, tabInfo);
        EditorMgr.getInstance().AddEditor({
            id: Constants.DASHBOARD_TAB_ID,
            type: EditorType.OTHER,
            path: '',
            gpath: '',
            isSubscribed: false,
            fontsize: Constants.DEFAULT_FONTSIZE,
            content: undefined,
            lastUpdated: undefined,
            isModified: false,
        });        
        setIsOtherTab(true);
        setActiveTab('Dashboard');
    }

    /**
     * openAIChat - open the AI chat
     */
    function openAIChat() {
        console.log('Opening AI Chat');
        if (EditorMgr.getInstance().hasEditorSession(Constants.AI_CHAT_TAB_ID)) {
            const layoutModel = EditorMgr.getInstance().getLayoutModel();
            layoutModel?.doAction(Actions.selectTab(Constants.AI_CHAT_TAB_ID));
            setActiveTab('AI Chat');
            return;
        };
        const tabInfo: IJsonTabNode = {
            component: 'aichat',
            name: 'AI Chat',
            id: Constants.AI_CHAT_TAB_ID,
            helpText: 'Chat with AI models from Hugging Face',
        };
        layoutref!.current?.addTabToTabSet(Constants.EDITOR_TABSET_ID, tabInfo);
        EditorMgr.getInstance().AddEditor({
            id: Constants.AI_CHAT_TAB_ID,
            type: EditorType.OTHER,
            path: '',
            gpath: '',
            isSubscribed: false,
            fontsize: Constants.DEFAULT_FONTSIZE,
            content: undefined,
            lastUpdated: undefined,
            isModified: false,
        });
        setIsOtherTab(true);
        setActiveTab('AI Chat');
    }

    /**
     * onConnectionSelected - process seected connection
     * @param connType
     */
    function onConnectionSelected(connType: ConnectionType) {
        const appMgr: AppMgr = AppMgr.getInstance();
        if (connType === ConnectionType.USB) {
            appMgr.emit(EventType.EVENT_CONNECTION, ConnectionCMD.CONNECT_USB);
            toggleDialog();
        } else if (connType === ConnectionType.BLUETOOTH) {
            appMgr.emit(EventType.EVENT_CONNECTION, ConnectionCMD.CONNECT_BLUETOOTH);
            toggleDialog();
        }
    }

    /**
     * onConnectClicked
     */
    function onConnectBtnClicked() {
        console.log('onConnectBtnClicked');
        setDialogContent(<ConnectionDlg callback={onConnectionSelected} />);
        toggleDialog();
    }

    /**
     * boadcastRunningState - broadcast the running state to the app manager
     * @param running
     */
    function broadcastRunningState(running: boolean) {
        AppMgr.getInstance().emit(EventType.EVENT_ISRUNNING, running ? 'running' : 'stopped');
    }

    /**
     * onRunBtnClicked
     */
    async function onRunBtnClicked() {
        console.log('onRunBtnClicked');

        if (!isRunning) {
            if (!isConnected) {
                setDialogContent(
                    <AlertDialog
                        alertMessage={t('XRP-not-connected')}
                        toggleDialog={toggleDialog}
                    />,
                );
                toggleDialog();
                return;
            }

            // make sure this is not the dashboard tab or AI chat tab
            if (activeTab === 'Dashboard' || activeTab === 'AI Chat') {
                setDialogContent(
                    <AlertDialog
                        alertMessage={t('dashboard-no-run')}
                        toggleDialog={toggleDialog}
                    />,
                );
                toggleDialog();
                return;
            }

            setRunning(true);
            broadcastRunningState(true);

            // Check battery voltage && version
            await CommandToXRPMgr.getInstance()
                .batteryVoltage()
                .then((voltage) => {
                    const connectionType = AppMgr.getInstance().getConnectionType();
                    const beginExecution = async () => {
                        // Update the main.js
                        const session: EditorSession | undefined =
                            EditorMgr.getInstance().getEditorSession(activeTab);
                        if (session) {
                            // Save the current editor before running
                            //TODO - signal activeTab editor to save the file
                            await CommandToXRPMgr.getInstance()
                                .updateMainFile(session.path)
                                .then(async (lines) => {
                                    await CommandToXRPMgr.getInstance().executeLines(lines);
                                });
                        }
                        setRunning(false);
                        broadcastRunningState(false);
                        CommandToXRPMgr.getInstance().stopProgram();
                    }

                    const handlePowerSwitchOK = async () => {
                        setRunning(true);
                        toggleDialog();
                        beginExecution();
                    }

                    const handlePowerSwitchCancel = () => {
                        setRunning(false);
                        toggleDialog();
                    }

                    if (connectionType === ConnectionType.USB) {
                        if (voltage < 0.45) {
                            // display a confirmation message to ask the user to turn on the power switch
                            const powerswitchImage = CommandToXRPMgr.getInstance().getXRPDrive() === Constants.XRP_PROCESSOR_BETA ? powerswitch_beta : powerswitch_standard;
                            setDialogContent(<PowerSwitchAlert powerswitchImage={powerswitchImage} cancelCallback={handlePowerSwitchCancel}  okayCallback={handlePowerSwitchOK}/>);
                            toggleDialog();
                        } else {
                            beginExecution();
                        }
                    } else if (connectionType === ConnectionType.BLUETOOTH) {
                        if (voltage < 0.45) {
                            // display a confirmation message to ask the user to turn on the power switch
                            //this one will only happen if they are using a power device plugged into the USB port and the power switch is off.
                            setDialogContent(<PowerSwitchAlert cancelCallback={handlePowerSwitchCancel} okayCallback={handlePowerSwitchOK}/>);
                            toggleDialog();
                        } else if (voltage < 5.0) {
                            setDialogContent(<BatteryBadDlg cancelCallback={toggleDialog} />);
                            toggleDialog();
                        } else {
                            beginExecution();
                        }
                    }
                });         
        } else {
            setRunning(false);
            broadcastRunningState(false);
            CommandToXRPMgr.getInstance().stopProgram();
        }
    }

    /**
     * onSettingsClicked - handle the setting button click event
     */
    function onSettingsClicked() {
        setMoreMenuOpen(false);
        setDialogContent(<SettingsDlg isXrpConnected={isConnected} toggleDialog={toggleDialog} />);
        toggleDialog();
    }

    /**
     * onAiClicked - handle the AI button click event
     */
    function onAiClicked() {
        setMoreMenuOpen(false);
        openAIChat();
    }

    /**
     * onDashboardClicked - handle the Dashboard button click event
     */
    function onDashboardClicked() {
        setMoreMenuOpen(false);
        viewDashboard();
    }

    /**
     * onDriverClicked - handle the Driver button click event
     */
    function onDriverClicked() {
        setMoreMenuOpen(false);
        if (!isConnected) {
            setDialogContent(
                <AlertDialog
                    alertMessage={t('XRP-not-connected')}
                    toggleDialog={toggleDialog}
                />,
            );
            toggleDialog();
            return;
        }
        setDialogContent(<XRPDriverInstallDlg toggleDialog={toggleDialog}/>);
        toggleDialog();
    }

    /**
     * ChangeLog
     */
    function ChangeLog() {
        setDialogContent(<ChangeLogDlg closeDialog={toggleDialog}/>);
        toggleDialog();
    }

    /**
     * toggleMoreDropdown - toggle the more dropdown menu
     */
    function toggleMoreDropdown() {
        setMoreMenuOpen(!isMoreMenuOpen);
    }

    /**
     * clearDialogContent - toggle the dialog open/close state
     */
    function clearDialogContent(){
        setDialogContent(<div />);
    };

    /**
     * toggleDialog - toggle the dialog open and closed
     */
    function toggleDialog() {
        if (!dialogRef.current) {
            return;
        }
        if (dialogRef.current.hasAttribute('open')) {
            setDialogContent(<div />);
            dialogRef.current.close();
        }
        else dialogRef.current.showModal();
    }

    const navItems: MenuDataItem[] = [
        {
            label: t('file'),
            children: [
                {
                    label: t('newFile'),
                    iconImage: fileadd,
                    clicked: NewFile,
                    isFile: true,
                },
                {
                    label: t('uploadFiles'),
                    iconImage: fileupload,
                    clicked: UploadFile,
                    isFile: true,
                },
                {
                    label: t('exportToPC'),
                    iconImage: fileexport,
                    clicked: ExportToPC,
                    isFile: true,
                },
                {
                    label: t('saveFile'),
                    iconImage: filesave,
                    clicked: SaveFile,
                    isFile: true,
                },
                {
                    label: t('saveFileAs'),
                    iconImage: filesaveas,
                    clicked: SaveFileAs,
                    isFile: true,
                },
            ],
        },
        {
            label: t('view'),
            children: [
                {
                    label: t('viewPythonFile'),
                    iconImage: python,
                    clicked: ViewPythonFile,
                    isView: true,
                },
                {
                    label: t('convertToPython'),
                    iconImage: convert,
                    clicked: ConvertToPython,
                    isView: true,
                },
            ],
            childrenExt: [
                {
                    label: t('increaseFont'),
                    iconImage: fontplus,
                    clicked: FontPlusPlus,
                    isView: true,
                },
                {
                    label: t('decreaseFont'),
                    iconImage: fontminus,
                    clicked: FontMinus,
                    isView: true,
                },
            ],
        },
        {
            label: t('help'),
            children: [
                {
                    label: t('userGuide'),
                    iconImage: userguide,
                    link: 'https://xrpusersguide.readthedocs.io/en/latest/course/introduction.html',
                },
                {
                    label: t('apiReference'),
                    iconImage: apilink,
                    link: 'https://open-stem.github.io/XRP_MicroPython/',
                },
                {
                    label: t('cirriculum'),
                    iconImage: cirriculum,
                    link: 'https://introtoroboticsv2.readthedocs.io/en/latest/',
                },
                {
                    label: t('userHelpForum'),
                    iconImage: forum,
                    link: 'https://xrp.discourse.group/',
                },
                {
                    label: t('changeLog'),
                    iconImage: changelog,
                    clicked: ChangeLog,
                },
            ],
        },
    ];

    const moreMenu: MenuDataItem[] = [
        {
            label: t('ai-chat'),
            iconImage: chatbot,
            clicked: onAiClicked,
        },
        {
            label: t('dashboard'),
            iconImage: dashboard,
            clicked: onDashboardClicked,
        },
        { 
            label: t('drivers'),
            iconImage: drivers,
            clicked: onDriverClicked,
        },
        {
            label: t('settings'),
            iconImage: settings,
            clicked: onSettingsClicked,
        }
    ];

    return (
        <div className="flex items-center justify-between p-1 px-5 shadow-md text-shark-100">
            <div className="flex flex-row gap-4 transition-all">
                {/** Logo */}
                <img src={logo} alt="logo" width="100" height="50" />
                {navItems.map((item, index) => (
                    <div key={index} className="group relative transition-all">
                        <p className="ml-2 mt-4 flex cursor-pointer text-matisse-100 group-hover:bg-curious-blue-700 dark:group-hover:bg-mountain-mist-950">
                            <span>{item.label}</span>
                            {item.children && (
                                <TiArrowSortedDown className="mt-1 rotate-180 transition-all group-hover:rotate-0" />
                            )}
                        </p>
                        {item.children && (
                            <div className="absolute left-2 top-[52] z-[100] mx-auto hidden flex-col bg-curious-blue-700 py-3 shadow-md transition-all group-hover:flex dark:bg-mountain-mist-950 dark:group-hover:bg-mountain-mist-950">
                                <ul id="pythonId" className="flex cursor-pointer flex-col">
                                    {item.children.map((child, ci) => (
                                        <li
                                            key={ci}
                                            className={`text-neutral-200 py-1 pl-4 pr-10 hover:bg-matisse-400 dark:hover:bg-shark-500 ${child.isFile && (!isConnected && (!isLogin || child.label !== t('newFile'))) ? 'pointer-events-none' : 'pointer-events-auto'} ${child.isView && !isBlockly ? 'hidden' : 'visible'}`}
                                            onClick={child.clicked}
                                        >
                                            <MenuItem
                                                isConnected={(isConnected || (isLogin && child.label === t('newFile'))) && !isRunning}
                                                isOther={isOtherTab}
                                                item={child}
                                            />
                                        </li>
                                    ))}
                                </ul>
                                {item.childrenExt && (
                                    <ul
                                        id="blockId"
                                        className={`${isBlockly ? 'hidden' : 'visible'} cursor-pointer flex-col`}
                                        
                                    >
                                        {item.childrenExt?.map((child, ci) => (
                                            <li
                                                key={ci}
                                                className="text-neutral-200 py-1 pl-4 pr-10 hover:bg-matisse-400 dark:hover:bg-shark-500"
                                                onClick={child.clicked}
                                            >
                                                <MenuItem
                                                    isConnected={isConnected && !isRunning}
                                                    isOther={isOtherTab}
                                                    item={child}
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {/* place the joystick icon here after the menu*/}
                <img className={`mt-1 ${isGamepadConnected ? 'visible' : 'hidden'}`} src={gamepad} alt='game pad' width={40} height={30} />
            </div>
            {/** platform infor and connect button*/}
            <div className="flex flex-row items-center gap-4">
                <div className="flex flex-col items-center text-sm text-shark-300">
                    {xprID && <span>{`${xprID['platform']}-${xprID['XRPID']}`}</span>}
                </div>
                <button
                    id="connectBtn"
                    className={`text-neutral-900 flex h-full w-[200] items-center justify-center gap-2 rounded-3xl bg-shark-200 px-4 py-2 text-matisse-900 hover:bg-curious-blue-300 dark:bg-shark-600 dark:text-shark-100 dark:hover:bg-shark-500 ${isConnected ? 'hidden' : ''}`}
                    onClick={onConnectBtnClicked}
                >
                    <svg width="20" height="20" viewBox="0 0 20 20">
                        <polygon points="11 4 12 4 12 8 16 8 16 9 11 9"></polygon>
                        <polygon points="4 11 9 11 9 16 8 16 8 12 4 12"></polygon>
                        <path fill="none" stroke="#000" strokeWidth="1.1" d="M12,8 L18,2"></path>
                        <path fill="none" stroke="#000" strokeWidth="1.1" d="M2,18 L8,12"></path>
                    </svg>
                    <span>{t('connectXRP')}</span>
                </button>
                <button
                    id="runBtn"
                    className={`text-white h-full w-[120] items-center justify-center rounded-3xl px-4 py-2 ${isRunning ? 'bg-cinnabar-600' : 'bg-chateau-green-500'} ${isConnected ? 'flex' : 'hidden'}`}
                    onClick={onRunBtnClicked}
                >
                    {isRunning ? (
                        <>
                            <span>{t('stop')}</span>
                            <IoStop />
                        </>
                    ) : (
                        <>
                            <span>{t('run')}</span>
                            <IoPlaySharp />
                        </>
                    )}
                </button>
                <div ref={dropdownRef} className='group relative transition-all'>
                    <button id="settingsId" onClick={toggleMoreDropdown} className={`flex flex-row rounded-3xl p-1 ${isMoreMenuOpen ? 'bg-curious-blue-400 dark:bg-mountain-mist-800' : 'bg-curious-blue-700 dark:bg-mountain-mist-950'}`}>
                        <MdMoreVert size={'1.5em'} />
                    </button>
                    {isMoreMenuOpen &&
                        <div className="absolute right-0 top-11 w-40 z-[100] mx-auto flex flex-col bg-curious-blue-700 py-3 shadow-md transition-all dark:bg-mountain-mist-950 dark:group-hover:bg-mountain-mist-950">
                            <ul id="pythonId" className="flex cursor-pointer flex-col">
                                {moreMenu.map((item, ci) => (
                                    <li
                                        key={ci}
                                        className={`text-neutral-200 py-1 pl-4 pr-10 hover:bg-matisse-400 dark:hover:bg-shark-500`}
                                        onClick={item.clicked}
                                    >
                                        <MenuItem
                                            isConnected={isConnected && !isRunning}
                                            isOther={false}
                                            item={item}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>
        }           
                </div>
            </div>
            <Dialog isOpen={isDlgOpen} toggleDialog={toggleDialog} ref={dialogRef}>
                {dialogContent}
            </Dialog>
        </div>
    );
}

export default NavBar;
