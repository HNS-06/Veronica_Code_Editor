import { useEffect, useRef, useState, useCallback } from 'react';
import { useTabContext } from '../context/TabContext';
import { useSettings } from '../context/SettingsContext';

interface GhostTextState {
    suggestion: string;
    position: { lineNumber: number; column: number } | null;
    isLoading: boolean;
}

/**
 * Inline AI ghost-text completion hook.
 * Debounces cursor idle, sends context to backend, returns suggestion.
 */
export function useGhostText(editorRef: React.MutableRefObject<any>) {
    const { settings } = useSettings();
    const [ghost, setGhost] = useState<GhostTextState>({ suggestion: '', position: null, isLoading: false });
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const decorationsRef = useRef<string[]>([]);
    const { getActiveTab } = useTabContext();
    const wsRef = useRef<WebSocket | null>(null);

    const clearGhost = useCallback(() => {
        setGhost({ suggestion: '', position: null, isLoading: false });
        if (editorRef.current) {
            decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
        }
    }, []);

    const acceptGhost = useCallback(() => {
        if (!ghost.suggestion || !ghost.position || !editorRef.current) return;
        const editor = editorRef.current;
        const pos = ghost.position;
        editor.executeEdits('ghost-text', [{
            range: { startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column },
            text: ghost.suggestion,
        }]);
        clearGhost();
    }, [ghost, clearGhost]);

    const requestCompletion = useCallback(async (code: string, cursorLine: number, cursorCol: number) => {
        const tab = getActiveTab();
        if (!tab || !code.trim()) return;

        // Get code up to cursor as context
        const lines = code.split('\n');
        const contextBefore = lines.slice(Math.max(0, cursorLine - 20), cursorLine).join('\n');
        if (contextBefore.trim().length < 5) return;

        setGhost(g => ({ ...g, isLoading: true }));

        try {
            const res = await fetch('http://localhost:4000/api/ai/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: contextBefore,
                    fileName: tab.fileName,
                    language: tab.language,
                    model: settings.aiModel,
                    geminiKey: settings.geminiKey,
                    openaiKey: settings.openaiKey
                }),
                signal: AbortSignal.timeout(5000)
            });
            const data = await res.json();
            const suggestion = data.completion?.trim();
            if (suggestion) {
                setGhost({ suggestion, position: { lineNumber: cursorLine, column: cursorCol }, isLoading: false });
            } else {
                setGhost(g => ({ ...g, isLoading: false }));
            }
        } catch {
            setGhost(g => ({ ...g, isLoading: false }));
        }
    }, [getActiveTab]);

    // Attach to Monaco editor events
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const disposable = editor.onDidChangeCursorPosition((e: any) => {
            clearGhost();
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                const model = editor.getModel();
                if (!model) return;
                const pos = editor.getPosition();
                requestCompletion(model.getValue(), pos.lineNumber, pos.column);
            }, 700);
        });

        // Tab key to accept
        const keyDisposable = editor.addAction({
            id: 'accept-ghost-text',
            label: 'Accept AI Suggestion',
            keybindings: [9], // Tab
            run: () => { acceptGhost(); },
        });

        // Escape to dismiss
        const escDisposable = editor.addAction({
            id: 'dismiss-ghost-text',
            label: 'Dismiss AI Suggestion',
            keybindings: [9 | (1 << 9)], // Escape (key code)
            run: clearGhost,
        });

        return () => {
            disposable.dispose();
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [editorRef.current, requestCompletion, acceptGhost, clearGhost]);

    // Show ghost text as Monaco decoration
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor || !ghost.suggestion || !ghost.position) {
            if (editor) decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
            return;
        }

        // Show inline ghost using a "after" content decoration
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [{
            range: {
                startLineNumber: ghost.position.lineNumber,
                startColumn: ghost.position.column,
                endLineNumber: ghost.position.lineNumber,
                endColumn: ghost.position.column,
            },
            options: {
                after: {
                    content: ghost.suggestion.split('\n')[0].slice(0, 80),
                    inlineClassName: 'ghost-text-decoration',
                },
            }
        }]);
    }, [ghost]);

    return { ghost, clearGhost, acceptGhost };
}
