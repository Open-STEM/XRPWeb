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
import autocomplete from '@assets/images/prompt_suggestion.svg';
import python from '@assets/images/python.svg';
import convert from '@assets/images/convert.svg';
import forum from '@assets/images/forum.svg';
import cirriculum from '@assets/images/cirriculum.svg';
import changelog from '@assets/images/changelog.svg';
import { TiArrowSortedDown } from 'react-icons/ti';
import { IoPlaySharp } from 'react-icons/io5';
import { IoStop } from 'react-icons/io5';
import { useRef, useState } from 'react';
import i18n from '@/utils/i18n';
import Dialog from '@components/dialogs/dialog';
import ConnectionDlg from './dialogs/connectiondlg';
import FileSaveAsDialg from './dialogs/filesaveasdlg';
import treeData from '@/utils/testdata';
import { ConnectionType } from '@/utils/types';
import BleParingDlg from '@components/dialogs/ble-pairingdlg';
import UsbConnectDlg from '@components/dialogs/usb-connectdlg';
import { useFilePicker } from 'use-file-picker';
import SaveToXRPDlg from '@components/dialogs/save-to-xrpdlg';
import { MenuDataItem } from '@/widgets/menutypes';
import MenuItem from '@/widgets/menu';

type NavBarProps = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layoutref: any;
};

/**
 * NavBar component - create the navigation bar
 * @param layoutref 
 * @returns 
 */
function NavBar({ layoutref }: NavBarProps) {
    const [isFooter, setIsFooter] = useState(false);
    const [isConnected, setConnected] = useState(false);
    const [isRunning, setRunning] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [dialogContent, setDialogContent] = useState<React.ReactNode>(null);
    const [okButtonlabel, setOkButtonLabel] = useState('');
    const { openFilePicker, filesContent, loading, errors } = useFilePicker({
        multiple: true,
        accept: ['.py', '.blocks'],
    });

    if (loading) {
        return <div>Loading...</div>;
    };

    if (errors.length > 0) {
        return <div>Error: {errors.values.toString()}</div>;
    };

    /**
     * NewFile - create either a new Python or Blockly file
     */
    function NewFile() {
        console.log(i18n.t('newFile'), layoutref);
    }

    /**
     * UploadFile - upload a file to XRP
     */
    function UploadFile() {
        console.log(i18n.t('uploadFile'));
        openFilePicker();
        console.log(filesContent);
    }

    /**
     * ExportToPC - export the file to PC
     */
    function ExportToPC() {
        console.log(i18n.t('exportToPC'));
        openFilePicker();
        console.log(filesContent);
    }

    /**
     * SaveFile - Save file to XRP
     */
    function SaveFile() {
        console.log(i18n.t('saveFile'));
        setIsFooter(false);
        setDialogContent(<SaveToXRPDlg />);
        cancelDialog();
    }

    /**
     * SaveFileAs - save the current file as to the XRP
     */
    function SaveFileAs() {
        console.log(i18n.t('saveFileAs'));
        setOkButtonLabel(i18n.t('okButton'));
        setIsFooter(true);
        setDialogContent(<FileSaveAsDialg treeData={treeData} />);
        cancelDialog();
    }

    /**
     * ViewPythonFile - view the Python file
     */
    function ViewPythonFile() {
        console.log(i18n.t('viewPythonFile'));
    }

    /**
     * ConvertToPython - convert the current blockly file to Python
     */
    function ConvertToPython() {
        console.log(i18n.t('convertToPython'));
    }

    /**
     * FontPlusPlus - increase font in the current window
     */
    function FontPlusPlus() {
        console.log(i18n.t('increaseFont'));
    }

    /**
     * FontMinus - decrease font in the current window
     */
    function FontMinus() {
        console.log(i18n.t('decreaseFont'));
    }

    /**
     * ToggleAutoComplete - toggle autocomplete
     */
    function ToggleAutoComplete() {
        console.log(i18n.t('toggleAutoComplete'));
    }

    /**
     * onConnectionSelected - process seected connection
     * @param connType
     */
    function onConnectionSelected(connType: ConnectionType) {
        if (connType === ConnectionType.USB) {
            setIsFooter(true);
            setOkButtonLabel(i18n.t('connect'));
            setDialogContent(<UsbConnectDlg url={'http://localhost:3000'} />);
        } else if (connType === ConnectionType.BLUETOOTH) {
            setIsFooter(true);
            setOkButtonLabel(i18n.t('pair'));
            setDialogContent(<BleParingDlg url="http://localhost" />);
        }
    }

    /**
     * onConnectClicked
     */
    function onConnectBtnClicked() {
        console.log('onConnectBtnClicked');
        setOkButtonLabel(i18n.t('okButton'));
        setDialogContent(<ConnectionDlg callback={onConnectionSelected} />);
        cancelDialog();
        if (isConnected) {
            setConnected(false);
            setRunning(false);
        } else {
            setConnected(true);
            setRunning(true);
        }
    }

    /**
     * onRunBtnClicked
     */
    function onRunBtnClicked() {
        console.log('onRunBtnClicked');
        if (isRunning) {
            setConnected(true);
            setRunning(false);
        } else {
            setConnected(false);
            setRunning(true);
        }
    }

    /**
     * ChangeLog
     */
    function ChangeLog() {}

    /**
     * cancelDialog - toggle the dialog open and closed
     */
    function cancelDialog() {
        if (!dialogRef.current) {
            return;
        }
        if (dialogRef.current.hasAttribute('open')) dialogRef.current.close();
        else dialogRef.current.showModal();
    }

    /**
     * okDialog - callback function from dialog information
     */
    function okDialog() {
        // process ok dialog form data here first
        cancelDialog();
    }

    const navItems: MenuDataItem[] = [
        {
            label: i18n.t('file'),
            children: [
                {
                    label: i18n.t('newFile'),
                    iconImage: fileadd,
                    clicked: NewFile,
                },
                {
                    label: i18n.t('uploadFile'),
                    iconImage: fileupload,
                    clicked: UploadFile,
                },
                {
                    label: i18n.t('exportToPC'),
                    iconImage: fileexport,
                    clicked: ExportToPC,
                },
                {
                    label: i18n.t('saveFile'),
                    iconImage: filesave,
                    clicked: SaveFile,
                },
                {
                    label: i18n.t('saveFileAs'),
                    iconImage: filesaveas,
                    clicked: SaveFileAs,
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
                },
                {
                    label: i18n.t('convertToPython'),
                    iconImage: convert,
                    clicked: ConvertToPython,
                },
            ],
            childrenExt: [
                {
                    label: i18n.t('increaseFont'),
                    iconImage: fontplus,
                    clicked: FontPlusPlus,
                },
                {
                    label: i18n.t('decreaseFont'),
                    iconImage: fontminus,
                    clicked: FontMinus,
                },
                {
                    label: 'i18n.t("toggleAutoComplete")',
                    iconImage: autocomplete,
                    clicked: ToggleAutoComplete,
                },
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
        <div className="p-1 px-10 flex justify-between items-center">
            <div className="flex flex-row gap-4 transition-all">
                {/** Logo */}
                <img src={logo} alt="logo" width="100" height="50" />
                {navItems.map((item, index) => (
                    <div key={index} className="relative group transition-all">
                        <p className="flex ml-2 mt-4 cursor-pointer text-matisse-100 group-hover:bg-curious-blue-700 dark:group-hover:bg-mountain-mist-950">
                            <span>{item.label}</span>
                            {item.children && (
                                <TiArrowSortedDown className="mt-1 rotate-180 transition-all group-hover:rotate-0" />
                            )}
                        </p>
                        {item.children && (
                            <div className="absolute left-2 top-[52] hidden mx-auto flex-col py-3 group-hover:flex bg-curious-blue-700 shadow-md transition-all dark:group-hover:bg-mountain-mist-950 z-[100] dark:bg-mountain-mist-950">
                                <ul id="pythonId" className="flex flex-col cursor-pointer">
                                    {item.children.map((child, ci) => (
                                        <li
                                            key={ci}
                                            className="py-1 pl-4 pr-10 text-neutral-200 hover:bg-matisse-400 dark:hover:bg-shark-500"
                                            onClick={child.clicked}
                                        >
                                            <MenuItem item={child} />
                                        </li>
                                    ))}
                                </ul>
                                {item.childrenExt && (
                                    <ul id="blockId" className="flex-col cursor-pointer hidden">
                                        {item.childrenExt?.map((child, ci) => (
                                            <li
                                                key={ci}
                                                className="py-1 pl-4 pr-10 text-neutral-200 hover:bg-matisse-400 dark:hover:bg-shark-500"
                                                onClick={child.clicked}
                                            >
                                                <MenuItem item={child} />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {/** connect */}
            <div className="flex flex-row  items-center">
                <button
                    id="connectBtn"
                    className={`px-4 py-2 rounded-3xl h-full w-[200] flex items-center justify-center gap-2 text-matisse-900 text-neutral-900 bg-shark-200 hover:bg-curious-blue-300 dark:bg-shark-600 dark:text-shark-100 dark:hover:bg-shark-500 ${isConnected ? 'hidden' : ''}`}
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
                    className={`px-4 py-2 rounded-3xl h-full w-[120] text-white items-center justify-center ${isRunning ? 'bg-cinnabar-600' : 'bg-chateau-green-500'} ${isConnected ? 'flex' : 'hidden'}`}
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
            </div>
            <Dialog
                cancelDialog={cancelDialog}
                okDialog={okDialog}
                okBtnLabel={okButtonlabel}
                footter={isFooter}
                ref={dialogRef}
            >
                {dialogContent}
            </Dialog>
        </div>
    );
}

export default NavBar;
