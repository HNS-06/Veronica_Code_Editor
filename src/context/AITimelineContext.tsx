import React, { createContext, useContext, useState, useCallback } from 'react';

export interface AIAction {
    id: string;
    timestamp: number;
    actionType: 'chat' | 'refactor' | 'debug' | 'docgen' | 'testgen' | 'security' | 'explain' | 'complete' | 'other';
    description: string;
    filePath?: string;
    snapshotBefore?: string;
    snapshotAfter?: string;
}

interface AITimelineContextType {
    timeline: AIAction[];
    logAction: (action: Omit<AIAction, 'id' | 'timestamp'>) => string;
    revertAction: (id: string) => string | null;
    clearTimeline: () => void;
}

const AITimelineContext = createContext<AITimelineContextType>({
    timeline: [],
    logAction: () => '',
    revertAction: () => null,
    clearTimeline: () => { },
});

export function AITimelineProvider({ children }: { children: React.ReactNode }) {
    const [timeline, setTimeline] = useState<AIAction[]>(() => {
        try {
            const saved = localStorage.getItem('veronica_ai_timeline');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Keep only last 50 actions and avoid bloating size
                return parsed.map((a: AIAction) => ({ ...a, snapshotBefore: undefined, snapshotAfter: undefined })).slice(-50);
            }
        } catch { }
        return [];
    });

    const logAction = useCallback((action: Omit<AIAction, 'id' | 'timestamp'>): string => {
        const id = `action-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const newAction: AIAction = { ...action, id, timestamp: Date.now() };
        setTimeline(prev => {
            const updated = [...prev, newAction].slice(-100); // Keep last 100 actions in memory
            try {
                // Persist without snapshots to avoid hitting localStorage quota
                const toStore = updated.map(a => ({ ...a, snapshotBefore: undefined, snapshotAfter: undefined }));
                localStorage.setItem('veronica_ai_timeline', JSON.stringify(toStore.slice(-50)));
            } catch { }
            return updated;
        });
        return id;
    }, []);

    const revertAction = useCallback((id: string): string | null => {
        const action = timeline.find(a => a.id === id);
        if (!action?.snapshotBefore) return null;
        return action.snapshotBefore;
    }, [timeline]);

    const clearTimeline = useCallback(() => {
        setTimeline([]);
        localStorage.removeItem('veronica_ai_timeline');
    }, []);

    return (
        <AITimelineContext.Provider value={{ timeline, logAction, revertAction, clearTimeline }}>
            {children}
        </AITimelineContext.Provider>
    );
}

export const useAITimeline = () => useContext(AITimelineContext);
