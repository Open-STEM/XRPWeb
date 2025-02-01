import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/widgets/button';
import { describe, expect, it, vi } from 'vitest';

describe('Button', () => {
    it('renders the button with the correct label', () => {
        render(<Button label="Click Me" onClicked={() => {}} />);
        const buttonElement = screen.getByTestId('Click Me');
        expect(buttonElement).toBeInTheDocument();
        expect(buttonElement).toHaveTextContent('Click Me');
    });

    it('calls the onClicked function when clicked', () => {
        const handleClick = vi.fn();
        render(<Button label="Click Me" onClicked={handleClick} />);
        const buttonElement = screen.getByTestId('Click Me');
        fireEvent.click(buttonElement);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('has the correct class names', () => {
        render(<Button label="Click Me" onClicked={() => {}} />);
        const buttonElement = screen.getByTestId('Click Me');
        expect(buttonElement).toHaveClass('bg-matisse-600');
        expect(buttonElement).toHaveClass('text-curious-blue-50');
        expect(buttonElement).toHaveClass('hover:bg-matisse-500');
    });
});