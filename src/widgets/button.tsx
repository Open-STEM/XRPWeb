type ButtonProps = {
    disabled?: boolean;
    children: React.ReactNode
    onClicked: () => void;
};
/**
 * Button widget
 * @param btnProps
 * @returns
 */
function Button(btnProps: ButtonProps) {
    return (
        <button
            type="button"
            aria-label='btn'
            data-testid='btn'
            className={`bg-matisse-600 text-curious-blue-50 hover:bg-matisse-500 dark:bg-shark-600 dark:hover:bg-shark-500 dark:border-shark-500 flex h-10 w-auto items-center rounded-3xl border px-8 py-2 text-lg ${btnProps.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer opacity-100'}`}
            onClick={btnProps.onClicked}
            disabled={btnProps.disabled}
        >
            {btnProps.children}
        </button>
    );
}

export default Button;
