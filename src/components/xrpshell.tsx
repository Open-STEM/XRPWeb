import { useEffect, useState } from 'react';
import { FitAddon } from '@xterm/addon-fit';
import { useXTerm } from 'react-xtermjs';
import AppMgr, { EventType, Themes } from '@/managers/appmgr';
import Connection, { ConnectionState } from '@/connections/connection';
import i18n from '@/utils/i18n';

function XRPShell() {
    const { instance, ref } = useXTerm();
    const fitAddon = new FitAddon();
    const [connection, setConnection] = useState<Connection | null>(null);

    useEffect(() => {
        instance?.loadAddon(fitAddon);

        if (instance) {
            const darkTheme = { foreground: '#ddd', background: '#333333' };
            const lightTheme = { foreground: '#41393b', background: '#f0eff0' };

            const theme = AppMgr.getInstance().getTheme() === Themes.DARK ? darkTheme : lightTheme;
            instance.options = {
                cursorStyle: 'underline',
                cursorInactiveStyle: 'bar',
                disableStdin: false,
                logLevel: 'info',
                theme: theme,
            };

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
                        setConnection(activeConn);
                        activeConn.onData = (data) => {
                            instance.write(data)
                        };
                    }
                } else if (state === ConnectionState.Disconnected.toString()) {
                    instance?.clear();
                    setConnection(null);
                }
            });

            if (connection === null)  {
                instance?.clear();
                instance?.writeln(i18n.t('disconnectXterm'));
            }
        }

        const handleResize = () => fitAddon.fit();

        // send shell terminal input to device
        if (connection) {
            instance?.onData((data) => {
                if (connection?.isBusy()) {
                    return;
                }
                connection?.writeToDevice(data);
            });
        }

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
