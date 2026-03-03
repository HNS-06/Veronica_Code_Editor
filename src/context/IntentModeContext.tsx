import React, { createContext, useContext, useState, useEffect } from 'react';

export type IntentMode = 'build' | 'refactor' | 'learn' | 'secure' | 'optimize';

interface IntentModeContextType {
    mode: IntentMode;
    setMode: (mode: IntentMode) => void;
    getModeSystemPrompt: () => string;
    getModeLabel: () => string;
    getModeEmoji: () => string;
}

const MODE_CONFIG: Record<IntentMode, { label: string; emoji: string; prompt: string }> = {
    build: {
        label: 'Build',
        emoji: '🔨',
        prompt: 'You are in BUILD MODE. Act as a senior software architect. Generate robust, scalable code structures. Prioritize creating new features and scaffolding. Think in systems, not lines of code. Be decisive and produce working, production-ready code.',
    },
    refactor: {
        label: 'Refactor',
        emoji: '♻️',
        prompt: 'You are in REFACTOR MODE. Act as a code quality expert. Focus on reducing complexity, eliminating duplication, improving naming, and applying SOLID principles. Never change behaviour — only improve structure. Show before/after diffs when possible.',
    },
    learn: {
        label: 'Learn',
        emoji: '📚',
        prompt: 'You are in LEARN MODE. Act as a patient senior engineer and educator. Explain every decision. Add detailed comments. Use analogies. Walk the user through what the code does and why. Prioritize understanding over brevity.',
    },
    secure: {
        label: 'Secure',
        emoji: '🛡️',
        prompt: 'You are in SECURE MODE. Act as a security expert and ethical hacker. Identify every injection point, authentication flaw, exposed secret, and data leak. Rate severity (Critical / High / Medium / Low). Provide hardened code fixes. Never skip edge cases.',
    },
    optimize: {
        label: 'Optimize',
        emoji: '⚡',
        prompt: 'You are in OPTIMIZE MODE. Act as a performance engineer. Reduce time complexity, memory usage, and bundle size. Profile before optimizing. Identify N+1 queries, unnecessary re-renders, and expensive loops. Quantify improvements where possible.',
    },
};

const IntentModeContext = createContext<IntentModeContextType>({
    mode: 'build',
    setMode: () => { },
    getModeSystemPrompt: () => '',
    getModeLabel: () => '',
    getModeEmoji: () => '',
});

export function IntentModeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = useState<IntentMode>(() => {
        return (localStorage.getItem('veronica_intent_mode') as IntentMode) || 'build';
    });

    const setMode = (m: IntentMode) => {
        setModeState(m);
        localStorage.setItem('veronica_intent_mode', m);
    };

    const getModeSystemPrompt = () => MODE_CONFIG[mode].prompt;
    const getModeLabel = () => MODE_CONFIG[mode].label;
    const getModeEmoji = () => MODE_CONFIG[mode].emoji;

    return (
        <IntentModeContext.Provider value={{ mode, setMode, getModeSystemPrompt, getModeLabel, getModeEmoji }}>
            {children}
        </IntentModeContext.Provider>
    );
}

export const useIntentMode = () => useContext(IntentModeContext);
export { MODE_CONFIG };
