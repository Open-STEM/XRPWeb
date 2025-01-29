type ButtonProps = {
    label: string;
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
            aria-label={btnProps.label}
            data-testid={btnProps.label}
            className="bg-matisse-600 text-curious-blue-50 hover:bg-matisse-500 dark:bg-shark-600 dark:hover:bg-shark-500 dark:border-shark-500 flex h-10 w-auto items-center rounded-3xl border px-8 py-2 text-lg"
            onClick={btnProps.onClicked}
        >
            <span>{btnProps.label}</span>
        </button>
    );
}

export default Button;
