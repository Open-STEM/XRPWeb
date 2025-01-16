import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MonacoEditor from './MonacoEditor';

describe('<MonacoEditor />', () => {
    it('should check render with snapshot', () => {
        const component = render(<MonacoEditor width='100vw' height='100vh'/>)
        expect(component).toMatchSnapshot();
    });
})