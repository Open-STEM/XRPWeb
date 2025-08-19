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
import forum from '@assets/images/forum.svg';
import cirriculum from '@assets/images/cirriculum.svg';
import changelog from '@assets/images/changelog.svg';
import { TiArrowSortedDown } from 'react-icons/ti';
import { IoPlaySharp, IoSettings } from 'react-icons/io5';
import { IoStop } from 'react-icons/io5';
import { useEffect, useRef, useState } from 'react';
import i18n from '@/utils/i18n';
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
} from '@/utils/types';
import { useFilePicker } from 'use-file-picker';
import { MenuDataItem } from '@/widgets/menutypes';
import MenuItem from '@/widgets/menu';
import AppMgr, { EventType } from '@/managers/appmgr';
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
import SaveProgressDlg from '@/components/dialogs/save-progressdlg';
import ConfirmationDlg from './dialogs/confirmdlg';
import UpdateDlg from './dialogs/updatedlg';
import React from 'react';
import { CreateEditorTab } from '@/utils/editorUtils';
import ChangeLogDlg from './dialogs/changelog';
import { IJsonTabNode } from 'flexlayout-react';

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
    const [isConnected, setConnected] = useState(false);
    const [isRunning, setRunning] = useState(false);
    const [isBlockly, setBlockly] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [isDlgOpen, setDlgOpen] = useState(false);
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

    useEffect(() => {
        if (!hasSubscribed) {
            // subscribe to the connection event
            AppMgr.getInstance().on(EventType.EVENT_CONNECTION_STATUS, (state: string) => {
                if (state === ConnectionState.Connected.toString()) {
                    setConnected(true);
                    setRunning(false);
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
                } else if (type === EditorType.PYTHON) {
                    setBlockly(false);
                }
            });

            AppMgr.getInstance().on(EventType.EVENT_OPEN_FILE, async (filepath: string) => {
                const filename = filepath.split('/').pop();
                if (filename && EditorMgr.getInstance().hasEditorSession(filename)) return;
                const fileType = filename?.includes('.blocks') ? FileType.BLOCKLY : FileType.PYTHON;
                const fileData: NewFileData = {
                    parentId: '',
                    path: filepath,
                    name: filename || '',
                    filetype: fileType,
                };
                CreateEditorTab(fileData, layoutref);
                setActiveTab(fileData.name)
                await CommandToXRPMgr.getInstance()
                    .getFileContents(filepath)
                    .then((content) => {
                        // if the file is a block files, extract the blockly JSON out of the comment ##XRPBLOCKS
                        let bytes = content;
                        if (fileType === FileType.BLOCKLY) {
                            const data: string = new TextDecoder().decode(new Uint8Array(bytes));
                            const lines: string[] = data.split('##XRPBLOCKS ');
                            bytes = Array.from(new TextEncoder().encode(lines.slice(-1)[0]));
                        }
                        const text =
                            typeof bytes === 'string'
                                ? bytes
                                : new TextDecoder().decode(new Uint8Array(bytes));
                        // set the content in the editor
                        const loadContent = { name: filename, content: text };
                        AppMgr.getInstance().emit(EventType.EVENT_EDITOR_LOAD, JSON.stringify(loadContent));
                    });
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
                    setDialogContent(<SaveProgressDlg title='saveToXRPTitle'/>);
                    toggleDialog();
                    AppMgr.getInstance().on(EventType.EVENT_UPLOAD_DONE, () => {
                        toggleDialog();
                        AppMgr.getInstance().eventOff(EventType.EVENT_UPLOAD_DONE);
                        setDialogContent(<div />);
                    });
                }
            });

            hasSubscribed = true;
        }
    });

    if (loading) {
        return <div>Loading...</div>;
    }

    if (errors.length > 0) {
        return <div>Error: {errors.values.toString()}</div>;
    }

    /**
     * handleMPUpdateCallback - handle the MicroPython update callback
     */
    function handleMPUpdateCallback() {
        // ask the user to confirm the update and provide instructions to the user about the update
        const xrpDrive = CommandToXRPMgr.getInstance().getXRPDrive();
        setDialogContent(<ConfirmationDlg acceptCallback={handleMPUpdateConfirmed} toggleDialog={toggleDialog} confirmationMessage={i18n.t('update-mp-instructions', { drive: xrpDrive })} />);
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
            setDialogContent(<SaveProgressDlg title='mpUpdateTitle'/>);
            toggleDialog();
            await CommandToXRPMgr.getInstance().enterBootSelect();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const dirHandle = await (window as any).showDirectoryPicker();
            // await CommandToXRPMgr.getInstance().updateMicroPython(dirHandle);
            const fileHandle = await dirHandle?.getFileHandle("firmware.uf2", { create: true });
            writable = await fileHandle!.createWritable();
            const firmwareFilename = CommandToXRPMgr.getInstance().getXRPDrive() === "RPI-RP2" ? "firmware2040.uf2" : "firmware2350.uf2";
            AppMgr.getInstance().emit(EventType.EVENT_PROGRESS, '10');
            const data = await (await fetch("micropython/" + firmwareFilename)).arrayBuffer();
            await writable.write(data);
            AppMgr.getInstance().emit(EventType.EVENT_PROGRESS, '100');
            await writable.close();
        } catch(err) {
            console.log("Firmware update error: ", err);
            setDialogContent(<AlertDialog alertMessage={i18n.t('update-mp-error', { error: err})} toggleDialog={toggleDialog} />);
            toggleDialog();
        }
        setDialogContent(<AlertDialog alertMessage={i18n.t('update-mp-complete')} toggleDialog={toggleDialog} />);
        toggleDialog();
    }

    /**
     * handleXRPLibUpdateCallback - handle the XRPLib update callback
     */
    async function handleXRPLibUpdateCallback() {
        // ask the user to confirm the update and provide instructions to the user about the update
        const xrpDrive = CommandToXRPMgr.getInstance().getXRPDrive();
        setDialogContent(<ConfirmationDlg acceptCallback={handleXRPLibUpdateConfirmed} toggleDialog={toggleDialog} confirmationMessage={i18n.t('update-lib-instructions', { drive: xrpDrive })} />);
        toggleDialog();
    }

    /**
     * handleXRPLibUpdateConfirmed - handle the XRPLib update confirmed
     */
    async function handleXRPLibUpdateConfirmed() {
        toggleDialog();
        try {
            setDialogContent(<SaveProgressDlg title='xrpLibUpdateTitle'/>);
            toggleDialog();
            await CommandToXRPMgr.getInstance().updateLibrary();
        } catch (err) {
            console.log("Library update error: ", err);
            setDialogContent(<AlertDialog alertMessage={i18n.t('update-lib-error', { error: err})} toggleDialog={toggleDialog} />);
            toggleDialog();
        }
        toggleDialog();
        setDialogContent(<AlertDialog alertMessage={i18n.t('update-lib-complete')} toggleDialog={toggleDialog} />);
        toggleDialog();
    }

    /**
     * onNewFileSubmitted - get the form data and create a new file on the layout
     */
    async function onNewFileSubmitted(data: NewFileData) {
        CreateEditorTab(data, layoutref);
        setActiveTab(data.name);
        // create the file in XRP
        await CommandToXRPMgr.getInstance()
            .uploadFile(data.path, '')
            .then(() => {
                CommandToXRPMgr.getInstance().getOnBoardFSTree();
            });
        toggleDialog();
    }

    /**
     * NewFile - create either a new Python or Blockly file
     */
    function NewFile() {
        console.log(i18n.t('newFile'), layoutref);
        setDialogContent(
            <NewFileDlg submitCallback={onNewFileSubmitted} toggleDialog={toggleDialog} />,
        );
        toggleDialog();
    }

    /**
     * UploadFile - upload a file to XRP
     */
    function UploadFile() {
        console.log(i18n.t('uploadFile'));
        openFilePicker();
    }

    /**
     * ExportToPC - export the file to PC
     */
    function ExportToPC() {
        console.log(i18n.t('exportToPC'));
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
                <AlertDialog alertMessage={i18n.t('no-activetab')} toggleDialog={toggleDialog} />,
            );
            toggleDialog();
        }
    }

    /**
     * SaveFile - Save file to XRP
     */
    function SaveFile() {
        console.log(i18n.t('saveFile'));
        if (EditorMgr.getInstance().hasEditorSession(activeTab)) {
            AppMgr.getInstance().emit(EventType.EVENT_SAVE_EDITOR, '');
            setDialogContent(<SaveProgressDlg title='saveToXRPTitle'/>);
            AppMgr.getInstance().on(EventType.EVENT_UPLOAD_DONE, () => {
                toggleDialog();
                AppMgr.getInstance().eventOff(EventType.EVENT_UPLOAD_DONE);
                setDialogContent(<div />);
            });
        } else {
            setDialogContent(
                <AlertDialog alertMessage={i18n.t('no-activetab')} toggleDialog={toggleDialog} />,
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
        if (session) {
            session.path = fileData.path + '/' + fileData.name;
            AppMgr.getInstance().emit(EventType.EVENT_SAVE_EDITOR, '');
            // start the progress dialog
            setDialogContent(<SaveProgressDlg title='saveToXRPTitle'/>);
            toggleDialog();
            // subscribe to the UploadFile complete event
            AppMgr.getInstance().on(EventType.EVENT_UPLOAD_DONE, () => {
                toggleDialog();
                AppMgr.getInstance().eventOff(EventType.EVENT_UPLOAD_DONE);
                setDialogContent(<div />);
            });
            editorMgr.RenameEditor(activeTab, fileData.name);
        }
        toggleDialog();
    }

    /**
     * SaveFileAs - save the current file as to the XRP
     */
    function SaveFileAs() {
        console.log(i18n.t('saveFileAs'));
        if (EditorMgr.getInstance().hasEditorSession(activeTab)) {
            const folderList = AppMgr.getInstance().getFolderList();
            setDialogContent(
                <FileSaveAsDialg
                    treeData={JSON.stringify(folderList)}
                    saveCallback={handleSaveFileAs}
                    toggleDialog={toggleDialog}
                />,
            );
            toggleDialog();
        } else {
            setDialogContent(
                <AlertDialog alertMessage={i18n.t('no-activetab')} toggleDialog={toggleDialog} />,
            );
            toggleDialog();
        }
    }

    /**
     * ViewPythonFile - view the Python file
     */
    function ViewPythonFile() {
        const viewPythonHandler = (code: string) => {
            setDialogContent(<ViewPythonDlg code={code} toggleDlg={toggleDialog} />);
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
        setDialogContent(
            <ConfirmationDlg
                acceptCallback={BlocksToPythonCallback}
                toggleDialog={toggleDialog}
                confirmationMessage={i18n.t('convert-to-python-desc')}
            />,
        );
        toggleDialog();
    }

    /**
     * FontPlusPlus - increase font in the current window
     */
    function FontPlusPlus() {
        console.log(i18n.t('increaseFont'));
        AppMgr.getInstance().emit(EventType.EVENT_FONTCHANGE, FontSize.INCREASE);
    }

    /**
     * FontMinus - decrease font in the current window
     */
    function FontMinus() {
        console.log(i18n.t('decreaseFont'));
        AppMgr.getInstance().emit(EventType.EVENT_FONTCHANGE, FontSize.DESCREASE);
    }

    /**
     * viewDashboard - view the dashboard
     */
    function viewDashboard() {
        console.log(i18n.t('dashboard'));
        const tabInfo: IJsonTabNode = {
            component: 'dashboard',
            name: 'Dashboard',
            id: 'DashboardId',
            helpText: 'Dashboard',
        };
        layoutref!.current?.addTabToTabSet(Constants.EDITOR_TABSET_ID, tabInfo);
        setActiveTab('Dashboard');
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
     * onRunBtnClicked
     */
    async function onRunBtnClicked() {
        console.log('onRunBtnClicked');

        if (!isRunning) {
            let continueExecution = true;
            if (!isConnected) {
                setDialogContent(
                    <AlertDialog
                        alertMessage={i18n.t('XRP-not-connected')}
                        toggleDialog={toggleDialog}
                    />,
                );
                toggleDialog();
                return;
            }

            setRunning(true);

            // Check battery voltage && version
            await CommandToXRPMgr.getInstance()
                .batteryVoltage()
                .then((voltage) => {
                    const connectionType = AppMgr.getInstance().getConnectionType();
                    if (connectionType === ConnectionType.USB) {
                        if (voltage < 0.45) {
                            // display a confirmation message to ask the user to turn on the power switch
                            setDialogContent(<PowerSwitchAlert cancelCallback={toggleDialog} />);
                            toggleDialog();
                            continueExecution = false;
                        }
                    } else if (connectionType === ConnectionType.BLUETOOTH) {
                        if (voltage < 0.45) {
                            // display a confirmation message to ask the user to turn on the power switch
                            //this one will only happen if they are using a power device plugged into the USB port and the power switch is off.
                            setDialogContent(<PowerSwitchAlert cancelCallback={toggleDialog} />);
                            toggleDialog();
                        } else if (voltage < 5.0) {
                            setDialogContent(<BatteryBadDlg cancelCallback={toggleDialog} />);
                            toggleDialog();
                        }
                        continueExecution = true;
                    }
                });

            if (continueExecution) {
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
            }
        } else {
            setRunning(false);
            CommandToXRPMgr.getInstance().stopProgram();
        }
    }

    /**
     * onSettingsClicked - handle the setting button click event
     */
    function onSettingsClicked() {
        setDialogContent(<SettingsDlg toggleDialog={toggleDialog} />);
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
     * toggleDialog - toggle the dialog open and closed
     */
    function toggleDialog() {
        if (!dialogRef.current) {
            return;
        }
        if (dialogRef.current.hasAttribute('open')) {
            dialogRef.current.close();
        }
        else dialogRef.current.showModal();
    }

    const navItems: MenuDataItem[] = [
        {
            label: i18n.t('file'),
            children: [
                {
                    label: i18n.t('newFile'),
                    iconImage: fileadd,
                    clicked: NewFile,
                    isFile: true,
                },
                {
                    label: i18n.t('uploadFiles'),
                    iconImage: fileupload,
                    clicked: UploadFile,
                    isFile: true,
                },
                {
                    label: i18n.t('exportToPC'),
                    iconImage: fileexport,
                    clicked: ExportToPC,
                    isFile: true,
                },
                {
                    label: i18n.t('saveFile'),
                    iconImage: filesave,
                    clicked: SaveFile,
                    isFile: true,
                },
                {
                    label: i18n.t('saveFileAs'),
                    iconImage: filesaveas,
                    clicked: SaveFileAs,
                    isFile: true,
                },
            ],
        },
        {
            label: i18n.t('view'),
            children: [
                {
                    label: i18n.t('viewPythonFile'),
                    iconImage: python,
                    clicked: ViewPythonFile,
                    isView: true,
                },
                {
                    label: i18n.t('convertToPython'),
                    iconImage: convert,
                    clicked: ConvertToPython,
                    isView: true,
                },
            ],
            childrenExt: [
                {
                    label: i18n.t('increaseFont'),
                    iconImage: fontplus,
                    clicked: FontPlusPlus,
                    isView: true,
                },
                {
                    label: i18n.t('decreaseFont'),
                    iconImage: fontminus,
                    clicked: FontMinus,
                    isView: true,
                },
                {
                    label: i18n.t('dashboard'),
                    iconImage: dashboard,
                    clicked: viewDashboard,
                    isView: true,
                }
            ],
        },
        {
            label: i18n.t('help'),
            children: [
                {
                    label: i18n.t('userGuide'),
                    iconImage: userguide,
                    link: 'https://xrpusersguide.readthedocs.io/en/latest/course/introduction.html',
                },
                {
                    label: i18n.t('apiReference'),
                    iconImage: apilink,
                    link: 'https://open-stem.github.io/XRP_MicroPython/',
                },
                {
                    label: i18n.t('cirriculum'),
                    iconImage: cirriculum,
                    link: 'https://introtoroboticsv2.readthedocs.io/en/latest/',
                },
                {
                    label: i18n.t('userHelpForum'),
                    iconImage: forum,
                    link: 'https://xrp.discourse.group/',
                },
                {
                    label: i18n.t('changeLog'),
                    iconImage: changelog,
                    clicked: ChangeLog,
                },
            ],
        },
    ];

    return (
        <div className="flex items-center justify-between p-1 px-10">
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
                                            className={`text-neutral-200 py-1 pl-4 pr-10 hover:bg-matisse-400 dark:hover:bg-shark-500 ${child.isFile && !isConnected ? 'pointer-events-none' : 'pointer-events-auto'} ${child.isView && !isBlockly ? 'hidden' : 'visible'}`}
                                            onClick={child.clicked}
                                        >
                                            <MenuItem
                                                isConnected={isConnected && !isRunning}
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
                    <span>CONNECT XRP</span>
                </button>
                <button
                    id="runBtn"
                    className={`text-white h-full w-[120] items-center justify-center rounded-3xl px-4 py-2 ${isRunning ? 'bg-cinnabar-600' : 'bg-chateau-green-500'} ${isConnected ? 'flex' : 'hidden'}`}
                    onClick={onRunBtnClicked}
                >
                    {isRunning ? (
                        <>
                            <span>STOP</span>
                            <IoStop />
                        </>
                    ) : (
                        <>
                            <span>RUN</span>
                            <IoPlaySharp />
                        </>
                    )}
                </button>
                <button id="settingsId" onClick={onSettingsClicked}>
                    <IoSettings size={'1.5em'} />
                </button>
            </div>
            <Dialog isOpen={isDlgOpen} toggleDialog={toggleDialog} ref={dialogRef}>
                {dialogContent}
            </Dialog>
        </div>
    );
}

export default NavBar;
