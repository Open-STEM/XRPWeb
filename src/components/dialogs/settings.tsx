import i18n from '@/utils/i18n'
import { StorageKeys } from '@/utils/localstorage';
import { ListItem, SettingData, ViewType } from '@/utils/types';
import { useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import DialogFooter from './dialog-footer';

type SettingsProps = {
    toggleDialog: () => void;
}

function SettingsDlg({toggleDialog}: SettingsProps) {
    const [settings, setSettings] = useState<SettingData | null>(null);
    const [, setValue, ] = useLocalStorage(StorageKeys.VIEWSETTING, -1);

  const viewOptions: ListItem[] = [
    {
        label: i18n.t('folderview'),
        image: '',
    },
    {
        label: i18n.t('sysview'),
        image: ''
    }
  ]

  /**
   * handleSelection - save the selection in state
   * @param event 
   */
  const handleSelection = (event: { target: { value: string; }; }) => {
    setSettings({view: parseInt(event.target.value)})
  }

  /**
   * handleSave - saving the settings into localstorage
   */
  const handleSave = () => {
    setValue(settings?.view ?? -1)
    toggleDialog();
  }

  return (
    <div className='border rounded-md border-mountain-mist-700 flex flex-col gap-4 p-8 items-center shadow-md transition-all dark:border-shark-500 dark:bg-shark-950'>
        <div className='flex flex-col items-center w-[80%]'>
            <h1 className='text-lg font-bold text-mountain-mist-700'>{i18n.t('viewSettings')}</h1>
            <p className='text-sm text-mountain-mist-700'>{i18n.t('settingDescription')}</p>
        </div>
        <hr className='border-mountain-mist-600 w-full'/>
        <select
            id="viewSelectedId"
            className='dark:text-white block w-[90%] rounded border border-s-2 border-shark-300 border-s-curious-blue-500 bg-mountain-mist-100 p-2.5 text-sm text-mountain-mist-700 focus:border-mountain-mist-500 focus:ring-curious-blue-500 dark:border-shark-600 dark:border-s-shark-500 dark:bg-shark-500 dark:text-mountain-mist-200 dark:placeholder-mountain-mist-400 dark:focus:border-matisse-500 dark:focus:ring-shark-300'
            onChange={handleSelection}
            >
                <option defaultValue={ViewType.SYSTEM}>{i18n.t('sysview')}</option>
                { viewOptions.map((option) => (
                    <option key={option.label} value={option.label === i18n.t('folderview') ? ViewType.FOLDER : ViewType.SYSTEM}>{option.label}</option>
                ))}
        </select>
        <hr className='border-mountain-mist-600 w-full'/>
        <DialogFooter btnAcceptLabel={i18n.t('save')} btnAcceptCallback={handleSave} btnCancelCallback={toggleDialog} />
    </div>
  )
}

export default SettingsDlg