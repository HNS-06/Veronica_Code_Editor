import React, { useState, useEffect, useRef } from 'react';
import { X, Circle, Play, StopCircle } from 'lucide-react';
import { useTabContext, Tab } from '../../context/TabContext';

interface ElectronAPI {
    runFile: (filePath: string) => void;
    onRunDone: (cb: (code: number) => void) => () => void;
    onRunOutput: (cb: (data: string) => void) => () => void;
    [key: string]: unknown;
}
declare global {
    interface Window { electronAPI?: ElectronAPI; }
}

const LANG_ICONS: Record<string, string> = {
    typescript: '🔷', javascript: '🟨', python: '🐍', rust: '🦀',
    go: '🐹', java: '☕', html: '🌐', css: '🎨', json: '📋',
    markdown: '📝', shell: '🖥', ruby: '💎', cpp: '⚡',
    c: '⚙', php: '🐘', plaintext: '📄',
};

function FileIcon({ language, size = 14 }: { language: string; size?: number }) {
    const emoji = LANG_ICONS[language] || '📄';
    return <span style={{ fontSize: size * 0.9 }}>{emoji}</span>;
}

const RUNNABLE_EXTS = new Set(['.py', '.js', '.ts', '.jsx', '.tsx', '.rb', '.go', '.sh', '.php']);

function isRunnable(filePath: string) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    return ext ? RUNNABLE_EXTS.has(`.${ext}`) : false;
}

export function TabBar() {
    const { tabs, activeTabId, setActiveTab, closeTab, saveTab, getActiveTab } = useTabContext();
    const [isRunning, setIsRunning] = useState(false);
    const stopCleanupRef = useRef<(() => void) | null>(null);
    const activeTab = getActiveTab();

    // Clean up listeners when the component unmounts
    useEffect(() => () => { stopCleanupRef.current?.(); }, []);

    const handleRun = async () => {
        if (!activeTab?.filePath || isRunning) return;
        // Save file first
        if (activeTab.isDirty) await saveTab(activeTab.id);

        setIsRunning(true);

        // Tell Electron to run the file
        // @ts-ignore
        window.electronAPI?.runFile(activeTab.filePath);

        // Listen for done event
        if (window.electronAPI) {
            // @ts-ignore
            const cleanDone = window.electronAPI.onRunDone(() => {
                setIsRunning(false);
                cleanDone?.();
                stopCleanupRef.current = null;
            });
            stopCleanupRef.current = cleanDone;
        }
    };

    if (tabs.length === 0) return null;

    const canRun = activeTab ? isRunnable(activeTab.filePath) : false;

    return (
        <div
            className="flex items-end overflow-hidden border-b border-white/5 bg-black/20 shrink-0 h-[38px]"
        >
            {/* Tabs - allow scrolling */}
            <div className="flex items-end flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {tabs.map((tab: Tab) => {
                    const isActive = tab.id === activeTabId;
                    return (
                        <div key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 h-full cursor-pointer text-[12px] transition-all relative shrink-0 group border-r border-white/5 max-w-[180px] ${isActive
                                ? 'bg-background/80 text-white'
                                : 'bg-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                }`}
                        >
                            {isActive && <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent-blue rounded-b-sm" />}
                            <FileIcon language={tab.language} />
                            <span className="truncate flex-1">{tab.fileName}</span>
                            {tab.isDirty && (
                                <Circle size={6} className="text-accent-blue fill-accent-blue shrink-0 opacity-80" />
                            )}
                            <button
                                onClick={e => { e.stopPropagation(); tab.isDirty ? saveTab(tab.id).then(() => closeTab(tab.id)) : closeTab(tab.id); }}
                                className={`shrink-0 rounded p-0.5 transition-colors opacity-0 group-hover:opacity-100 ${tab.isDirty ? 'hover:bg-red-500/20 hover:text-red-400' : 'hover:bg-white/10'}`}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Run Button — only shown when active file is runnable */}
            {canRun && (
                <div className="flex items-center px-2 shrink-0 border-l border-white/5 h-full gap-1">
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        title={isRunning ? 'Running...' : `Run ${activeTab?.fileName}`}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all no-drag ${isRunning
                            ? 'bg-orange-500/20 text-orange-300 cursor-not-allowed'
                            : 'bg-green-500/15 text-green-400 hover:bg-green-500/25 hover:text-green-300 active:scale-95'
                            }`}
                    >
                        {isRunning ? (
                            <>
                                <StopCircle size={12} className="animate-pulse" />
                                <span>Running…</span>
                            </>
                        ) : (
                            <>
                                <Play size={12} className="fill-current" />
                                <span>Run</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
