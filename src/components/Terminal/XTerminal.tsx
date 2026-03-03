import React, { useEffect, useRef } from 'react';
import { useTerminal } from '../../hooks/useTerminal';

interface XTerminalProps {
    id: string;
    isActive: boolean;
    onKill?: () => void;
}

export function XTerminal({ id, isActive, onKill }: XTerminalProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { initTerminal, focusTerminal } = useTerminal(id);
    const initialized = useRef(false);

    // Initialize xterm on the container
    useEffect(() => {
        if (containerRef.current && !initialized.current) {
            initialized.current = true;
            initTerminal(containerRef.current);
        }
    }, []);

    // Re-focus xterm when tab becomes active
    useEffect(() => {
        if (isActive) {
            // Small delay to let layout settle
            const t1 = setTimeout(() => focusTerminal(), 50);
            const t2 = setTimeout(() => focusTerminal(), 200);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        }
    }, [isActive]);

    // Kill PTY on unmount
    useEffect(() => {
        return () => {
            if (window.terminalAPI) {
                window.terminalAPI.kill(id);
                window.terminalAPI.removeListeners(id);
            }
            onKill?.();
        };
    }, [id]);

    return (
        // Outer wrapper: visibility controlled here
        <div
            className="w-full h-full"
            style={{ display: isActive ? 'block' : 'none' }}
            // Clicking anywhere in the terminal area grabs keyboard focus
            onClick={() => focusTerminal()}
        >
            {/* xterm container: always block so xterm can measure dimensions */}
            <div
                ref={containerRef}
                className="w-full h-full"
                style={{ padding: '6px 10px', boxSizing: 'border-box' }}
            />
        </div>
    );
}
