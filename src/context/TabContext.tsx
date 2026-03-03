import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Tab {
    id: string;
    filePath: string;
    fileName: string;
    content: string;
    language: string;
    isDirty: boolean;
}

interface TabContextType {
    tabs: Tab[];
    activeTabId: string | null;
    openTab: (filePath: string, fileName: string, content: string) => void;
    closeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
    updateTabContent: (id: string, content: string) => void;
    saveTab: (id: string) => Promise<void>;
    getActiveTab: () => Tab | null;
    createUntitledTab: () => void;
}

const TabContext = createContext<TabContextType | null>(null);

function detectLanguage(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
        ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
        py: 'python', rs: 'rust', go: 'go', java: 'java', cs: 'csharp',
        cpp: 'cpp', c: 'c', html: 'html', css: 'css', scss: 'scss',
        json: 'json', md: 'markdown', yaml: 'yaml', yml: 'yaml',
        sh: 'shell', bash: 'shell', sql: 'sql', xml: 'xml', toml: 'toml',
    };
    return map[ext] || 'plaintext';
}

export function TabProvider({ children }: { children: React.ReactNode }) {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);

    const openTab = useCallback((filePath: string, fileName: string, content: string) => {
        setTabs(prev => {
            const existing = prev.find(t => t.filePath === filePath);
            if (existing) {
                setActiveTabId(existing.id);
                return prev;
            }
            const newTab: Tab = {
                id: `tab-${Date.now()}`,
                filePath, fileName, content,
                language: detectLanguage(fileName),
                isDirty: false,
            };
            setActiveTabId(newTab.id);
            return [...prev, newTab];
        });
    }, []);

    const closeTab = useCallback((id: string) => {
        setTabs(prev => {
            const idx = prev.findIndex(t => t.id === id);
            const remaining = prev.filter(t => t.id !== id);
            if (activeTabId === id) {
                const next = remaining[idx] || remaining[idx - 1] || null;
                setActiveTabId(next?.id ?? null);
            }
            return remaining;
        });
    }, [activeTabId]);

    const updateTabContent = useCallback((id: string, content: string) => {
        setTabs(prev => prev.map(t => t.id === id ? { ...t, content, isDirty: true } : t));
    }, []);

    const createUntitledTab = useCallback(() => {
        setTabs(prev => {
            let num = 1;
            while (prev.some(t => t.fileName === `Untitled-${num}`)) num++;
            const fileName = `Untitled-${num}`;
            const newTab: Tab = {
                id: `tab-${Date.now()}`,
                filePath: fileName,
                fileName,
                content: '',
                language: 'plaintext',
                isDirty: false,
            };
            setActiveTabId(newTab.id);
            return [...prev, newTab];
        });
    }, []);

    const saveTab = useCallback(async (id: string) => {
        const tab = tabs.find(t => t.id === id);
        if (!tab) return;

        let targetFilePath = tab.filePath;
        let targetFileName = tab.fileName;

        if (tab.filePath.startsWith('Untitled-')) {
            // @ts-ignore
            const savePath = await window.electronAPI.showSaveDialog();
            if (!savePath) return; // User cancelled
            targetFilePath = savePath;
            targetFileName = savePath.split(/[\\/]/).pop() || savePath;
        }

        try {
            // @ts-ignore
            await window.electronAPI.writeFile(targetFilePath, tab.content);
            setTabs(prev => prev.map(t => t.id === id ? { ...t, filePath: targetFilePath, fileName: targetFileName, isDirty: false } : t));
        } catch (e) { console.error('Save failed:', e); }
    }, [tabs]);

    const getActiveTab = useCallback(() => tabs.find(t => t.id === activeTabId) ?? null, [tabs, activeTabId]);

    return (
        <TabContext.Provider value={{ tabs, activeTabId, openTab, closeTab, setActiveTab: setActiveTabId, updateTabContent, saveTab, getActiveTab, createUntitledTab }}>
            {children}
        </TabContext.Provider>
    );
}

export function useTabContext() {
    const ctx = useContext(TabContext);
    if (!ctx) throw new Error('useTabContext must be used inside TabProvider');
    return ctx;
}
