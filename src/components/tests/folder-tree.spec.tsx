import { render, screen } from '@testing-library/react';
import FolderTree from '@/components/folder-tree';
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
            isReadOnly: false,
            path: '/',
            children: [
                {
                    id: '2',
                    name: 'File 1',
                    isReadOnly: true,
                    path: '/',
                    children: null
                },
            ],
        },
    ]);

    it('renders without crashing', () => {
        render(<FolderTree treeData={treeData} theme="light" />);
        expect(screen.getByText('Folder 1')).toBeInTheDocument();
    });

    it('renders tree nodes correctly', () => {
        render(<FolderTree treeData={treeData} theme="light" />);
        expect(screen.getByText('Folder 1')).toBeInTheDocument();
    });
});