import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from './components/Layout/AppLayout';
import { MonacoEditor } from './components/Editor/MonacoEditor';
import { TabBar } from './components/Editor/TabBar';
import { AIChatPanel } from './components/Chat/AIChatPanel';
import { TerminalPanel } from './components/Terminal/TerminalPanel';
import { CommandPalette } from './components/Palette/CommandPalette';
import { SettingsPanel } from './components/Panels/SettingsPanel';
import { useFileContext, FileProvider } from './context/FileContext';
import { TabProvider, useTabContext } from './context/TabContext';
import { SettingsProvider } from './context/SettingsContext';
import { ProjectIntelligenceProvider } from './context/ProjectIntelligenceContext';
import { IntentModeProvider } from './context/IntentModeContext';
import { AITimelineProvider } from './context/AITimelineContext';
import { Sparkles } from 'lucide-react';

function AppContent() {
    const { setFileContent } = useFileContext();
    const { tabs, activeTabId, openTab, updateTabContent, saveTab, getActiveTab, createUntitledTab } = useTabContext();

    const [isChatOpen, setIsChatOpen] = useState(true);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [terminalHeight, setTerminalHeight] = useState(240);

    const activeTab = getActiveTab();

    // Keep FileContext in sync so the chat Agent Mode works
    useEffect(() => {
        if (activeTab) setFileContent(activeTab.content);
    }, [activeTab?.content]);

    // Open file from explorer into a new tab
    const handleOpenFile = useCallback(async (filePath: string, fileName: string) => {
        try {
            // @ts-ignore
            const content = await window.electronAPI.readFile(filePath);
            openTab(filePath, fileName, content);
        } catch (e) { console.error(e); }
    }, [openTab]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                if (activeTabId) saveTab(activeTabId);
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                createUntitledTab();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '`') {
                e.preventDefault();
                setIsTerminalOpen(p => !p);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [activeTabId, saveTab]);

    return (
        <AppLayout
            onOpenChat={() => setIsChatOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenFile={handleOpenFile}
        >
            {/* Command Palette — global overlay */}
            <CommandPalette
                onToggleTerminal={() => setIsTerminalOpen(p => !p)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenChat={() => setIsChatOpen(true)}
            />

            {/* Settings Panel */}
            <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            <div className="flex-1 flex overflow-hidden relative min-h-0">
                {/* Editor area */}
                <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden z-10">
                    {tabs.length > 0 ? (
                        <>
                            <TabBar />
                            <div className="flex-1 overflow-hidden relative">
                                {tabs.map(tab => (
                                    <div key={tab.id}
                                        className="absolute inset-0"
                                        style={{ display: tab.id === activeTabId ? 'flex' : 'none', flexDirection: 'column' }}>
                                        <MonacoEditor
                                            language={tab.language}
                                            value={tab.content}
                                            onChange={val => updateTabContent(tab.id, val || '')}
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        /* Welcome screen */
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center glass-panel p-12 rounded-3xl border border-white/5 shadow-2xl max-w-2xl w-full">
                                <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-purple-400 mb-4">
                                    Veronica Editor
                                </h1>
                                <p className="text-gray-400 text-base mb-8 max-w-md mx-auto font-light leading-relaxed">
                                    The AI-first development environment. Open a folder to begin.
                                </p>
                                <div className="grid grid-cols-2 gap-3 text-[13px] text-gray-400 max-w-sm mx-auto">
                                    {[
                                        ['Ctrl+Shift+P', 'Command Palette'],
                                        ['Ctrl+`', 'Toggle Terminal'],
                                        ['Ctrl+N / S', 'New / Save File'],
                                        ['Ctrl+Shift+P → Settings', 'AI Model Switcher'],
                                    ].map(([key, desc]) => (
                                        <div key={key} className="flex flex-col p-3 bg-white/5 rounded-xl border border-white/5">
                                            <kbd className="text-[10px] text-accent-blue mb-1">{key}</kbd>
                                            <span className="text-[11px]">{desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Terminal */}
                    <TerminalPanel
                        isVisible={isTerminalOpen}
                        onToggle={() => setIsTerminalOpen(p => !p)}
                        height={terminalHeight}
                        onHeightChange={setTerminalHeight}
                    />
                </div>

                {/* AI Chat Panel */}
                {isChatOpen && (
                    <div className="absolute md:relative right-0 h-full w-[380px] max-w-full border-l border-white/10 flex flex-col bg-panel/60 backdrop-blur-[24px] shrink-0 z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.4)]">
                        <AIChatPanel onClose={() => setIsChatOpen(false)} />
                    </div>
                )}

                {/* Chat Reopen button */}
                {!isChatOpen && (
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="absolute bottom-6 right-6 z-30 flex items-center gap-2 bg-gradient-to-r from-accent-blue to-accent-purple text-white px-4 py-2.5 rounded-2xl shadow-[0_0_24px_rgba(139,92,246,0.4)] hover:shadow-[0_0_32px_rgba(139,92,246,0.6)] transition-all duration-200 text-sm font-medium hover:scale-105"
                    >
                        <Sparkles size={16} />
                        Open Veronica AI
                    </button>
                )}
            </div>
        </AppLayout>
    );
}

// Bridge FileContext openFile → TabContext openTab
function AppBridge() {
    const { openFile } = useFileContext();
    const { openTab } = useTabContext();

    // Override FileContext's openFile to open tabs instead
    useEffect(() => {
        // @ts-ignore: override openFile globally
        window.__veronicaOpenFile = async (filePath: string, fileName: string) => {
            try {
                // @ts-ignore
                const content = await window.electronAPI.readFile(filePath);
                openTab(filePath, fileName, content);
            } catch (e) { console.error(e); }
        };
    }, [openTab]);

    return null;
}

export default function App() {
    return (
        <SettingsProvider>
            <FileProvider>
                <TabProvider>
                    <ProjectIntelligenceProvider>
                        <IntentModeProvider>
                            <AITimelineProvider>
                                <AppBridge />
                                <AppContent />
                            </AITimelineProvider>
                        </IntentModeProvider>
                    </ProjectIntelligenceProvider>
                </TabProvider>
            </FileProvider>
        </SettingsProvider>
    );
}
