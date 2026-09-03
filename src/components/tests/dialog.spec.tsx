import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dialog from '@/components/dialogs/dialog';
import '@testing-library/jest-dom';

describe('Dialog Component', () => {
    it('should render the dialog with title and content', () => {
        const cancelDialog = vi.fn();
        render(
            <Dialog
                toggleDialog={cancelDialog}
                children="This is a test dialog"
                isOpen={false}
            />,
        );

        expect(screen.getByText('This is a test dialog')).toBeInTheDocument();
    });

    it('should not close when clicked (modal behavior)', () => {
        const cancelDialog = vi.fn();
        const { container } = render(
            <Dialog
                toggleDialog={cancelDialog}
                children={<div>Dialog Body</div>}
                isOpen={true}
            />,
        );

        const dialogElement = container.querySelector('dialog');
        dialogElement?.click();
        expect(cancelDialog).not.toHaveBeenCalled();
    });
});
