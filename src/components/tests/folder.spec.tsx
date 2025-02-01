import { render, screen } from '@testing-library/react';
import Folder from '@components/folder';
import { describe, it, expect, vi } from 'vitest';

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  
  // Stub the global ResizeObserver
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);

describe('Folder Component', () => {
    const treeData = JSON.stringify([
        {
            id: '1',
            name: 'Folder 1',
            isLeaf: false,
            children: [
                {
                    id: '2',
                    name: 'File 1',
                    isLeaf: true,
                },
            ],
        },
    ]);

    it('renders without crashing', () => {
        render(<Folder treeData={treeData} theme="light" />);
        expect(screen.getByText('Folder 1')).toBeInTheDocument();
    });

    it('renders tree nodes correctly', () => {
        render(<Folder treeData={treeData} theme="light" />);
        expect(screen.getByText('Folder 1')).toBeInTheDocument();
        expect(screen.getByText('File 1')).toBeInTheDocument();
    });
});