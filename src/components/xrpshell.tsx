import { useEffect } from 'react';
import { FitAddon } from '@xterm/addon-fit';
import { useXTerm } from 'react-xtermjs';
import AppMgr, { EventType, Themes } from '@/managers/appmgr';
import Connection, { ConnectionState } from '@/connections/connection';
import i18n from '@/utils/i18n';
import TerminalMgr from '@/managers/terminalmgr';

let hasSubscribed = false;
const TERMINAL_ID = 'xrp-shell';

/**
 * Capture terminal buffer content from XTerm instance
 * Gets the last output's worth of content, limited to 100 lines max
 */
function captureTerminalContent(instance: any): string {
    try {
        if (!instance || !instance.buffer || !instance.buffer.active) {
            return '';
        }

        const buffer = instance.buffer.active;
        const lines: string[] = [];
        const totalLines = buffer.length;
        const MAX_LINES = 100; // Hard limit to prevent flooding context window
        
        // Start from the end and work backwards to find meaningful content
        let contentLines = 0;
        let foundContent = false;
        
        // Look backwards from the current position to find the last meaningful output
        for (let i = totalLines - 1; i >= 0 && contentLines < MAX_LINES; i--) {
            const line = buffer.getLine(i);
            if (line) {
                const lineText = line.translateToString(true);
                
                // Stop if we hit an obvious prompt pattern (common patterns)
                if (lineText.match(/^[\w\-\.~]*[$#>]\s*$/) && foundContent) {
                    break;
                }
                
                // Skip empty lines at the end but include them once we find content
                if (lineText.trim() || foundContent) {
                    lines.unshift(lineText);
                    foundContent = true;
                    contentLines++;
                }
            }
        }
        
        // If we didn't find much content, fall back to a reasonable amount (but still respect MAX_LINES)
        if (lines.length < 5 && totalLines > 0) {
            lines.length = 0;
            const fallbackLines = Math.min(20, MAX_LINES);
            const startLine = Math.max(0, totalLines - fallbackLines);
            
            for (let i = startLine; i < totalLines; i++) {
                const line = buffer.getLine(i);
                if (line) {
                    const lineText = line.translateToString(true);
                    lines.push(lineText);
                }
            }
        }
        
        // Final safety check: truncate if somehow we exceeded MAX_LINES
        if (lines.length > MAX_LINES) {
            lines.splice(0, lines.length - MAX_LINES);
        }
        
        return lines.join('\n').trim();
    } catch (error) {
        console.warn('Failed to capture terminal content:', error);
        return '';
    }
}

function XRPShell() {
    const { instance, ref } = useXTerm();
    const fitAddon = new FitAddon();

    useEffect(() => {
        if (instance) {
            const darkTheme = { foreground: '#ddd', background: '#333333', cursor: '#ddd' };
            const lightTheme = { foreground: '#41393b', background: '#f0eff0', cursor: '#41393b' };

            instance?.loadAddon(fitAddon);
            const theme = AppMgr.getInstance().getTheme() === Themes.DARK ? darkTheme : lightTheme;
            instance.options = {
                cursorStyle: 'underline',
                cursorInactiveStyle: 'bar',
                scrollback: 2048,
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
                                
                                // Capture terminal content after data is written
                                setTimeout(() => {
                                    const content = captureTerminalContent(instance);
                                    const lineCount = instance.buffer?.active?.length || 0;
                                    TerminalMgr.updateLiveTerminalContent(TERMINAL_ID, content, lineCount);
                                }, 10); // Small delay to ensure content is rendered
                            };
                        }
                    } else if (state === ConnectionState.Disconnected.toString()) {
                        instance?.clear();
                        instance?.writeln(i18n.t('disconnectXterm'));
                        
                        // Update terminal content after disconnect message
                        setTimeout(() => {
                            const content = captureTerminalContent(instance);
                            const lineCount = instance.buffer?.active?.length || 0;
                            TerminalMgr.updateLiveTerminalContent(TERMINAL_ID, content, lineCount);
                        }, 10);
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
                fitAddon.fit();
            }
        }

        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);
        
        // Cleanup function to remove terminal content when component unmounts
        return () => {
            window.removeEventListener('resize', handleResize);
            TerminalMgr.removeLiveTerminalContent(TERMINAL_ID);
        };
    });

    return (
        <>
            <div ref={ref} className="h-full w-full" />
        </>
    );
}

export default XRPShell;
