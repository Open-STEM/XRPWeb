import { useTranslation } from 'react-i18next';
import { StorageKeys } from '@/utils/localstorage';
import { useLocalStorage } from 'usehooks-ts';
import DialogFooter from '@components/dialogs/dialog-footer';

type LanguageSelectionProps = {
    /**
     * Function to toggle the visibility of the dialog
     */
    toggleDialog: () => void;
};

function LanguageSelectionDlg({ toggleDialog }: LanguageSelectionProps) {
    const { t, i18n } = useTranslation();
    const [language, setLanguage] = useLocalStorage(StorageKeys.LANGUAGE, 'en');

    const languageOptions = [
        { code: 'en', label: 'English', nativeName: 'English' },
        { code: 'es', label: 'Spanish', nativeName: 'Español' },
    ];

    /**
     * handleLanguageChange - handles language selection change
     */
    const handleLanguageChange = (event: { target: { value: string } }) => {
        const newLanguage = event.target.value;
        setLanguage(newLanguage);
        i18n.changeLanguage(newLanguage);
    };

    /**
     * handleSave - save and close the dialog
     */
    const handleSave = () => {
        toggleDialog();
    };

    return (
        <div className="flex flex-col items-center gap-4 rounded-md border border-mountain-mist-700 p-8 shadow-md transition-all dark:border-shark-500 dark:bg-shark-950">
            <div className="flex w-[80%] flex-col items-center">
                <h1 className="text-lg font-bold text-mountain-mist-700 dark:text-mountain-mist-200">
                    {t('languageSelection')}
                </h1>
                <p className="text-sm text-mountain-mist-700 dark:text-mountain-mist-300">
                    {t('settingDescription')}
                </p>
            </div>
            <hr className="w-full border-mountain-mist-600" />
            <div className="flex w-full flex-col gap-2">
                <label className="text-mountain-mist-900 dark:text-curious-blue-100">
                    {t('language')}
                </label>
                <select
                    id="languageSelectedId"
                    className="dark:text-white block rounded border border-s-2 border-shark-300 border-s-curious-blue-500 bg-mountain-mist-100 p-2.5 text-sm text-mountain-mist-700 focus:border-mountain-mist-500 focus:ring-curious-blue-500 dark:border-shark-600 dark:border-s-shark-500 dark:bg-shark-500 dark:text-mountain-mist-200 dark:placeholder-mountain-mist-400 dark:focus:border-matisse-500 dark:focus:ring-shark-300"
                    value={language}
                    onChange={handleLanguageChange}
                >
                    {languageOptions.map((option) => (
                        <option key={option.code} value={option.code}>
                            {option.nativeName} ({option.label})
                        </option>
                    ))}
                </select>
                <p className="text-xs text-mountain-mist-600 dark:text-mountain-mist-400">
                    {t('language')}: {languageOptions.find(opt => opt.code === language)?.nativeName}
                </p>
            </div>
            <hr className="w-full border-mountain-mist-600" />
            <DialogFooter
                btnAcceptLabel={t('save')}
                btnAcceptCallback={handleSave}
                btnCancelCallback={toggleDialog}
            />
        </div>
    );
}

export default LanguageSelectionDlg;

