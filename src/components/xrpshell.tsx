import { useEffect } from 'react';
import { FitAddon } from '@xterm/addon-fit';
import { useXTerm } from 'react-xtermjs';
import AppMgr, { EventType, Themes } from '@/managers/appmgr';
import Connection, { ConnectionState } from '@/connections/connection';
import i18n from '@/utils/i18n';

let hasSubscribed = false;

function XRPShell() {
    const { instance, ref } = useXTerm();
    const fitAddon = new FitAddon();

    useEffect(() => {
        if (instance) {
            const darkTheme = { foreground: '#ddd', background: '#333333' };
            const lightTheme = { foreground: '#41393b', background: '#f0eff0' };

            instance?.loadAddon(fitAddon);
            const theme = AppMgr.getInstance().getTheme() === Themes.DARK ? darkTheme : lightTheme;
            instance.options = {
                cursorStyle: 'underline',
                cursorInactiveStyle: 'bar',
                disableStdin: false,
                logLevel: 'info',
                theme: theme,
            };

            if (!hasSubscribed) {
                hasSubscribed = true;
                AppMgr.getInstance().on(EventType.EVENT_THEME, (theme) => {
                    if (theme === Themes.DARK) {
                        instance.options.theme = darkTheme;
                    } else {
                        instance.options.theme = lightTheme;
                    }
                });

                AppMgr.getInstance().on(EventType.EVENT_CONNECTION_STATUS, (state: string) => {
                    if (state === ConnectionState.Connected.toString()) {
                        const activeConn: Connection | null = AppMgr.getInstance().getConnection();
                        if (activeConn != null) {
                            activeConn.onData = (data) => {
                                instance.write(data);
                            };
                        }
                    } else if (state === ConnectionState.Disconnected.toString()) {
                        instance?.clear();
                        instance?.writeln(i18n.t('disconnectXterm'));
                    }
                });

                // can only be subscribed to once
                instance?.onData((data) => {
                    const activeConn: Connection | null = AppMgr.getInstance().getConnection();
                    if (activeConn) {
                        if (activeConn.isBusy()) {
                            return;
                        }
                        activeConn.writeToDevice(data);
                    }
                });
            }
        }

        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    });

    return (
        <>
            <div ref={ref} className="h-full w-full" />
        </>
    );
}

export default XRPShell;
