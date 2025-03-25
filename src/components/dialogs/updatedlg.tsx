import i18n from '@/utils/i18n';
import DialogFooter from './dialog-footer';
import { Versions } from '@/utils/types';
import { CommandToXRPMgr } from '@/managers/commandstoxrpmgr';

type UpdateDlgProps = {
    isUpdateMP: boolean;
    isUpdateLib: boolean;
    mpVersion?: Versions;
    xrpVersion?: Versions;
    toggleDialog: () => void;
};

export default function UpdateDlg({ isUpdateMP, isUpdateLib, mpVersion, xrpVersion, toggleDialog }: UpdateDlgProps) {

    const handleUpdate = async () => {
        if (isUpdateMP) {
            await CommandToXRPMgr.getInstance().updateMicroPython();
        } else if (isUpdateLib) {
            if (xrpVersion)
                await CommandToXRPMgr.getInstance().updateLibrary(xrpVersion?.currentVersion)
        }
        toggleDialog();
    };

    return (
        <div className="flex flex-col items-center gap-4 rounded-md border border-mountain-mist-700 p-8 shadow-md transition-all dark:border-shark-500 dark:bg-shark-950">
            <div className="flex w-[90%] flex-col items-center">
                <h1 className="text-lg font-bold text-mountain-mist-700">{i18n.t('update')}</h1>
                <p className="text-sm text-mountain-mist-700">{i18n.t('update-desc')}</p>
            </div>
            <hr className="w-full border-mountain-mist-600" />
            <div className='flex flex-col items-start gap-2'>
                { isUpdateMP && <p className='text-mountain-mist-700 text-md text-left'>{i18n.t('update-MP')}</p> }
                { isUpdateLib && <p className='text-mountain-mist-700 text-md text-left'>{i18n.t('update-lib')}</p>}
                { mpVersion &&
                    <>
                        <div className='flex flex-row gap-2'>
                            <label className='text-sm text-mountain-mist-700'>{i18n.t('current-mp-version')}</label>
                            <span className='text-sm text-mountain-mist-900'>{mpVersion?.currentVersion}</span>
                        </div>
                        <div className='flex flex-row gap-2'>
                            <label className='text-sm text-mountain-mist-700'>{i18n.t('available-mp-version')}</label>
                            <span className='text-sm text-mountain-mist-900'>{mpVersion?.newVersion}</span>
                        </div>
                    </>
                }   
                { xrpVersion && 
                    <>
                        <div className='flex flex-col gap-2'>
                            <label className='text-sm text-mountain-mist-700'>{i18n.t('current-lib-version')}</label>
                            <span className='text-sm text-mountain-mist-900'>{xrpVersion?.currentVersion}</span>
                        </div>
                        <div className='flex flex-col gap-2'>
                            <label className='text-sm text-mountain-mist-700'>{i18n.t('available-lib-version')}</label>
                            <span className='text-sm text-mountain-mist-900'>{xrpVersion?.newVersion}</span>
                        </div>
                    </>
                }
                <p className='text-mountain-mist-700 text-md text-left'>{i18n.t('update-inst')}</p>
            </div>
            <hr className="w-full border-mountain-mist-600" />
            <DialogFooter
                disabledAccept={false}
                btnAcceptLabel={i18n.t('OK')}
                btnAcceptCallback={handleUpdate}
                btnCancelCallback={toggleDialog}
            />
        </div>        
    );
}
