import Bluetooth from '@assets/images/Bluetooth_FM_Black.png';
import Usb from '@assets/images/USB_icon.svg.png';
import { ConnectionType, ListItem } from '@/utils/types';
import { useTranslation } from 'react-i18next';

type ConnProps = {
    callback: (connection: ConnectionType) => void;
};

/**
 * Connection Dialog content
 * @param param0
 * @returns
 */
function ConnectionDlg(connprops: ConnProps) {
    const { t } = useTranslation();
    // list of items to display
    const items: ListItem[] = [
        {
            label: t('bluetoothConnection'),
            image: Bluetooth,
        },
        {
            label: t('usbConnection'),
            image: Usb,
        },
    ];

    /**
     * Connection handler - handledClick
     * @param item
     */
    const handleItemClick = (item: ListItem) => {
        console.log(item);
        switch (item.label) {
            case t('bluetoothConnection'):
                connprops.callback(ConnectionType.BLUETOOTH);
                break;
            case t('usbConnection'):
                connprops.callback(ConnectionType.USB);
                break;
            default:
                break;
        }
    };

    return (
        <div className="border rounded-md border-mountain-mist-700 dark:border-shark-500 dark:bg-shark-950 flex h-auto w-96 flex-col items-center gap-2 p-4 shadow-md transition-all">
            <h1 className='text-lg font-bold text-mountain-mist-700'>{t('connections')}</h1>
            <p className='text-sm text-mountain-mist-700'>{t('selectConnection')}</p>
            <hr className="w-full border-mountain-mist-600" />
            <ul>
                {items.map((item) => (
                    <li
                        key={item.label}
                        className="hover:bg-matisse-300 dark:hover:bg-shark-400 flex flex-row items-center gap-2 px-3 py-1 text-neutral-900 hover:text-neutral-100"
                        onClick={() => handleItemClick(item)}
                    >
                        <img data-testid={item.label} src={item.image} height="28px" width="36px" />
                        <span>{item.label}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default ConnectionDlg;
