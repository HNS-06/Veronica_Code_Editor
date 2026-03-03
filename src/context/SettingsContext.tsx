import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Settings {
    aiModel: string;
    geminiKey: string;
    openaiKey: string;
    fontFamily: string;
    fontSize: number;
    tabSize: number;
    wordWrap: boolean;
    theme: string;
}

const DEFAULT_SETTINGS: Settings = {
    aiModel: 'gemini-2.0-flash',
    geminiKey: '',
    openaiKey: '',
    fontFamily: 'Cascadia Code',
    fontSize: 14,
    tabSize: 4,
    wordWrap: false,
    theme: 'dark'
};

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const [settings, setSettings] = useState<Settings>(() => {
        try {
            const saved = localStorage.getItem('veronica_settings');
            return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });

    useEffect(() => {
        localStorage.setItem('veronica_settings', JSON.stringify(settings));

        // Apply theme to document body
        document.body.className = `theme-${settings.theme}`;
    }, [settings]);

    const updateSettings = (newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within SettingsProvider');
    return context;
};
