import { useEffect } from 'react';
import { FitAddon } from '@xterm/addon-fit';
import { useXTerm } from 'react-xtermjs';
import AppMgr, { EventType, Themes } from '@/managers/appmgr';

function XRPShell() {
    const { instance, ref } = useXTerm();
    const fitAddon = new FitAddon();

    useEffect(() => {
        instance?.loadAddon(fitAddon);
        if (instance) {
            const darkTheme = { foreground: '#ddd', background: '#333333'};
            const lightTheme = { foreground: '#41393b', background: '#f4f3f2'};

            const theme = AppMgr.getInstance().getTheme() === Themes.DARK ? darkTheme : lightTheme;
            instance.options.theme = theme;

            AppMgr.getInstance().on(EventType.EVENT_THEME, (theme) => {
                if (theme === Themes.DARK) {
                    instance.options.theme = darkTheme;
                } else {
                    instance.options.theme = lightTheme;
                }
            });
        }

        const handleResize = () => fitAddon.fit();

        instance?.writeln('welcome XRP Shell!');
        instance?.writeln('This is the XRP Terminal');

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    });

    return <div ref={ref} className="h-full w-full" />;
}

export default XRPShell;
