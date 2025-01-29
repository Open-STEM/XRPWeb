import { useEffect } from 'react';
import { FitAddon } from '@xterm/addon-fit';
import { useXTerm } from 'react-xtermjs';

function XRPShell() {
    const { instance, ref } = useXTerm();
    const fitAddon = new FitAddon();

    useEffect(() => {
        instance?.loadAddon(fitAddon);

        const handleResize = () => fitAddon.fit();

        instance?.writeln('welcome XRP Shell!');
        instance?.writeln('This is the XRP Terminal');

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    });

    return <div ref={ref} className="h-full w-full"></div>;
}

export default XRPShell;
