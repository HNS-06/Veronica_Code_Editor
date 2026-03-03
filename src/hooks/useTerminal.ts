import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { useSettings } from '../context/SettingsContext';
import { useFileContext } from '../context/FileContext';

// Persist terminal instances across hook re-renders / hot reloads
const terminalInstances = new Map<string, { term: Terminal; fit: FitAddon }>();

declare global {
    interface Window {
        terminalAPI?: {
            create: (id: string, cols: number, rows: number, cwd?: string) => Promise<{ success?: boolean; pid?: number; shell?: string; error?: string }>;
            write: (id: string, data: string) => void;
            resize: (id: string, cols: number, rows: number) => void;
            kill: (id: string) => void;
            onData: (id: string, cb: (data: string) => void) => () => void;
            onExit: (id: string, cb: (code: number) => void) => () => void;
            removeListeners: (id: string) => void;
        };
    }
}

export function useTerminal(id: string) {
    const { settings } = useSettings();
    const { openedDirPath } = useFileContext();
    const termRef = useRef<Terminal | null>(null);
    const fitRef = useRef<FitAddon | null>(null);
    const observerRef = useRef<ResizeObserver | null>(null);

    const focusTerminal = () => {
        termRef.current?.focus();
    };

    const initTerminal = (container: HTMLDivElement) => {
        // Reuse existing terminal instance to prevent flickering on tab switch
        if (terminalInstances.has(id)) {
            const { term, fit } = terminalInstances.get(id)!;
            try { term.open(container); } catch (_) { }
            setTimeout(() => { try { fit.fit(); term.focus(); } catch (_) { } }, 30);
            termRef.current = term;
            fitRef.current = fit;

            // Re-bind the observer
            const observer = new ResizeObserver(() => { try { fit.fit(); } catch (_) { } });
            observer.observe(container);
            observerRef.current = observer;

            return;
        }

        // ── Create xterm instance ──────────────────────────────────────────
        const term = new Terminal({
            theme: {
                background: 'transparent',
                foreground: '#d4d4d4',
                cursor: '#7c3aed',
                cursorAccent: '#ffffff',
                selectionBackground: 'rgba(139, 92, 246, 0.3)',
                black: '#1e1e2e', brightBlack: '#45475a',
                red: '#f38ba8', brightRed: '#f38ba8',
                green: '#a6e3a1', brightGreen: '#a6e3a1',
                yellow: '#f9e2af', brightYellow: '#f9e2af',
                blue: '#89b4fa', brightBlue: '#89b4fa',
                magenta: '#cba6f7', brightMagenta: '#cba6f7',
                cyan: '#89dceb', brightCyan: '#89dceb',
                white: '#cdd6f4', brightWhite: '#cdd6f4',
            },
            fontFamily: `'${settings.fontFamily}', 'Cascadia Code', 'Fira Code', Consolas, monospace`,
            fontSize: Math.max(10, settings.fontSize - 1),
            lineHeight: 1.5,
            cursorBlink: true,
            cursorStyle: 'bar',
            allowTransparency: true,
            scrollback: 5000,
            convertEol: true,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        try { term.loadAddon(new WebLinksAddon()); } catch (_) { }
        term.open(container);

        termRef.current = term;
        fitRef.current = fitAddon;
        terminalInstances.set(id, { term, fit: fitAddon });

        // ── Resize observer ──────────────────────────────────────────────
        const observer = new ResizeObserver(() => {
            try { fitAddon.fit(); } catch (_) { }
        });
        observer.observe(container);
        observerRef.current = observer;

        // ── Wire user input → PTY stdin ─────────────────────────────────
        // We do NOT dispose this on React unmount because the terminalInstance 
        // lives globally and we want to keep it wired to the IPC channel.
        term.onData((data) => {
            window.terminalAPI?.write(id, data);
        });

        // ── Wire xterm resize → PTY resize ──────────────────────────────
        term.onResize(({ cols, rows }) => {
            window.terminalAPI?.resize(id, cols, rows);
        });

        // ── Spawn PTY ─────────────────────────────────────────────────────
        const spawnPTY = async () => {
            if (!window.terminalAPI) {
                term.write('\r\n\x1b[33m⚠ Terminal IPC not available.\x1b[0m\r\n');
                return;
            }

            // Wait for xterm to measure dimensions after first paint
            await new Promise(r => setTimeout(r, 150));
            try { fitAddon.fit(); } catch (_) { }

            const { cols, rows } = term;
            const cwd = openedDirPath || undefined;

            const result = await window.terminalAPI.create(id, Math.max(2, cols), Math.max(2, rows), cwd);

            if (result.error) {
                term.write(`\r\n\x1b[31m✗ PTY Error: ${result.error}\x1b[0m\r\n`);
                return;
            }

            // Clear screen and focus aggressively
            term.clear();
            term.focus();
            setTimeout(() => { try { term.focus(); } catch (_) { } }, 80);
            setTimeout(() => { try { term.focus(); } catch (_) { } }, 300);
            setTimeout(() => { try { term.focus(); } catch (_) { } }, 600);

            // ── Receive PTY output → write to xterm ─────────────────────
            // We do not cleanupDataRef on React unmount because the tab might just be hidden.
            // The IPC listener is tied to the terminal ID and cleans up when the terminal dies.
            window.terminalAPI.onData(id, (data) => {
                term.write(data);
            });

            // ── PTY exit handler ─────────────────────────────────────────
            window.terminalAPI.onExit(id, (code) => {
                term.write(`\r\n\x1b[33m[Process exited with code ${code}. Press Enter to restart...]\x1b[0m\r\n`);
                const restartHandler = term.onData((key) => {
                    if (key === '\r' || key === '\n') {
                        restartHandler.dispose();
                        spawnPTY();
                    }
                });
            });
        };

        spawnPTY();
    };

    // Live update font settings
    useEffect(() => {
        if (termRef.current) {
            termRef.current.options.fontFamily = `'${settings.fontFamily}', 'Cascadia Code', 'Fira Code', Consolas, monospace`;
            termRef.current.options.fontSize = Math.max(10, settings.fontSize - 1);
            try { fitRef.current?.fit(); } catch (_) { }
        }
    }, [settings.fontFamily, settings.fontSize]);

    // Cleanup ONLY the dom-bound observer on unmount. 
    // Do NOT dispose xterm event listeners because the xterm instance persists 
    // globally in terminalInstances across re-renders.
    useEffect(() => {
        return () => {
            observerRef.current?.disconnect();
        };
    }, []);

    return { initTerminal, focusTerminal };
}
