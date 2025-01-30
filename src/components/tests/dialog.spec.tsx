import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Dialog from '@/components/dialogs/dialog';
import '@testing-library/jest-dom';

describe('Dialog Component', () => {
    it('should render the dialog with title and content', () => {
        const cancelDialog = vi.fn();
        const okBtnHandler = vi.fn();
        render(
            <Dialog
                okDialog={okBtnHandler}
                cancelDialog={cancelDialog}
                okBtnLabel="OK"
                children="This is a test dialog"
                footter={true}
            />,
        );

        expect(screen.getByText('This is a test dialog')).toBeInTheDocument();
    });

    it('should call when cancel button is clicked', async () => {
        const cancelDialog = vi.fn();
        const okBtnHandler = vi.fn();
        render(
            <Dialog
                okDialog={okBtnHandler}
                cancelDialog={cancelDialog}
                okBtnLabel="OK"
                children="This is a test dialog"
                footter={true}
            />,
        );

        const cancelButton = screen.getByTestId('Cancel');
        await userEvent.click(cancelButton);

        expect(cancelDialog).toHaveBeenCalledTimes(1);

        const okButton = screen.getByTestId('OK');
        await userEvent.click(okButton);

        expect(cancelDialog).toHaveBeenCalledTimes(1);
    });

    it('should not render the dialog footter when footter is false', () => {
        const cancelDialog = vi.fn();
        const okBtnHandler = vi.fn();
        render(
            <Dialog
                okDialog={okBtnHandler}
                cancelDialog={cancelDialog}
                okBtnLabel="OK"
                children="This is a test dialog"
                footter={false}
            />,
        );

        expect(screen.queryByText('<span>OK</span>')).not.toBeInTheDocument();
    });
});
