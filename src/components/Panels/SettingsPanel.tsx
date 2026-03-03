import React, { useState } from 'react';
import { X, Cpu, Palette, Code, Terminal, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const AI_MODELS = [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', badge: 'Free', badgeColor: 'text-green-400' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', badge: '128k ctx', badgeColor: 'text-blue-400' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', badge: 'Premium', badgeColor: 'text-yellow-400' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', badge: 'Fast', badgeColor: 'text-blue-400' },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', badge: 'Best Code', badgeColor: 'text-purple-400' },
    { id: 'ollama-local', name: 'Ollama (Local)', provider: 'Local', badge: 'Offline', badgeColor: 'text-gray-400' },
];

const THEMES = [
    { id: 'dark', name: 'Veronica Dark', preview: 'from-gray-900 to-black' },
    { id: 'midnight', name: 'Midnight Blue', preview: 'from-blue-950 to-black' },
    { id: 'dracula', name: 'Dracula', preview: 'from-purple-950 to-gray-900' },
];

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
    const { settings, updateSettings } = useSettings();
    const [activeSection, setActiveSection] = useState('ai');

    const sections = [
        { id: 'ai', label: 'AI Models', icon: <Cpu size={15} /> },
        { id: 'editor', label: 'Editor', icon: <Code size={15} /> },
        { id: 'appearance', label: 'Appearance', icon: <Palette size={15} /> },
        { id: 'terminal', label: 'Terminal', icon: <Terminal size={15} /> },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]" onClick={onClose} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-[95vw] max-h-[85vh] z-[151] bg-panel/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <Sliders size={16} className="text-accent-blue" />
                                <span className="font-semibold text-white text-[14px]">Settings</span>
                            </div>
                            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Sidebar */}
                            <div className="w-44 border-r border-white/5 p-2 shrink-0">
                                {sections.map(s => (
                                    <button key={s.id} onClick={() => setActiveSection(s.id)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] transition-colors mb-0.5 ${activeSection === s.id ? 'bg-accent-blue/10 text-accent-blue' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                                        {s.icon} {s.label}
                                    </button>
                                ))}
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                {activeSection === 'ai' && (
                                    <div className="space-y-5">
                                        <div>
                                            <h3 className="text-[13px] font-semibold text-white mb-3">AI Model</h3>
                                            <div className="space-y-2">
                                                {AI_MODELS.map(m => (
                                                    <div key={m.id} onClick={() => updateSettings({ aiModel: m.id })}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${settings.aiModel === m.id ? 'border-accent-blue/50 bg-accent-blue/10' : 'border-white/5 hover:border-white/10 hover:bg-white/5'}`}>
                                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${settings.aiModel === m.id ? 'border-accent-blue' : 'border-white/20'}`}>
                                                            {settings.aiModel === m.id && <div className="w-2 h-2 rounded-full bg-accent-blue" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-[12px] font-medium text-white">{m.name}</div>
                                                            <div className="text-[10px] text-gray-500">{m.provider}</div>
                                                        </div>
                                                        <span className={`text-[10px] ${m.badgeColor} border border-current/30 px-1.5 py-0.5 rounded-full`}>{m.badge}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-[13px] font-semibold text-white mb-3">API Keys</h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[11px] text-gray-500 mb-1.5 block">Gemini API Key</label>
                                                    <input type="password" spellCheck={false} value={settings.geminiKey || ''} onChange={e => updateSettings({ geminiKey: e.target.value })}
                                                        placeholder="AIzaSy..."
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-[12px] text-white focus:outline-none focus:border-accent-blue/50 placeholder-gray-700" />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] text-gray-500 mb-1.5 block">OpenAI API Key</label>
                                                    <input type="password" spellCheck={false} value={settings.openaiKey || ''} onChange={e => updateSettings({ openaiKey: e.target.value })}
                                                        placeholder="sk-..."
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-[12px] text-white focus:outline-none focus:border-accent-blue/50 placeholder-gray-700" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'editor' && (
                                    <div className="space-y-5">
                                        <div>
                                            <label className="text-[11px] text-gray-500 mb-2 block">Font Family</label>
                                            <select value={settings.fontFamily} onChange={e => updateSettings({ fontFamily: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-[12px] text-white focus:outline-none focus:border-accent-blue/50">
                                                {['Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Consolas'].map(f => (
                                                    <option key={f} value={f}>{f}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[11px] text-gray-500 mb-2 block">Font Size: {settings.fontSize}px</label>
                                            <input type="range" min={10} max={24} value={settings.fontSize} onChange={e => updateSettings({ fontSize: +e.target.value })}
                                                className="w-full accent-accent-blue" />
                                        </div>
                                        <div>
                                            <label className="text-[11px] text-gray-500 mb-2 block">Tab Size: {settings.tabSize}</label>
                                            <input type="range" min={2} max={8} step={2} value={settings.tabSize} onChange={e => updateSettings({ tabSize: +e.target.value })}
                                                className="w-full accent-accent-blue" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[12px] text-gray-300">Word Wrap</span>
                                            <button onClick={() => updateSettings({ wordWrap: !settings.wordWrap })}
                                                className={`relative w-10 h-5 rounded-full transition-colors ${settings.wordWrap ? 'bg-accent-blue' : 'bg-white/10'}`}>
                                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings.wordWrap ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'appearance' && (
                                    <div className="space-y-4">
                                        <h3 className="text-[13px] font-semibold text-white mb-3">Theme</h3>
                                        <div className="space-y-2">
                                            {THEMES.map(t => (
                                                <div key={t.id} onClick={() => updateSettings({ theme: t.id })}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${settings.theme === t.id ? 'border-accent-blue/50 bg-accent-blue/10' : 'border-white/5 hover:border-white/10'}`}>
                                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.preview}`} />
                                                    <span className="text-[12px] text-white">{t.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'terminal' && (
                                    <div className="space-y-4">
                                        <p className="text-[12px] text-gray-400">Terminal uses Catppuccin Mocha theme. Built-in configuration coming soon.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
