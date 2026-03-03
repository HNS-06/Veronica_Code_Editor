import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Command, Search, File, Terminal, Settings, GitBranch, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTabContext } from '../../context/TabContext';

interface Command {
    id: string;
    name: string;
    description?: string;
    shortcut?: string;
    icon: React.ReactNode;
    action: () => void;
    category: 'file' | 'view' | 'ai' | 'git' | 'terminal';
}

interface CommandPaletteProps {
    onToggleTerminal: () => void;
    onOpenSettings: () => void;
    onOpenChat: () => void;
}

export function CommandPalette({ onToggleTerminal, onOpenSettings, onOpenChat }: CommandPaletteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const { tabs, setActiveTab, closeTab } = useTabContext();

    const allCommands: Command[] = [
        { id: 'toggle-terminal', name: 'Toggle Terminal', description: 'Show or hide the integrated terminal', shortcut: 'Ctrl+`', icon: <Terminal size={14} />, action: onToggleTerminal, category: 'terminal' },
        { id: 'open-settings', name: 'Open Settings', description: 'Configure editor preferences', icon: <Settings size={14} />, action: onOpenSettings, category: 'view' },
        { id: 'open-chat', name: 'Open Veronica AI', description: 'Open the AI assistant panel', icon: <Sparkles size={14} />, action: onOpenChat, category: 'ai' },
        { id: 'switch-tab-1', name: 'Switch to Tab 1', category: 'file', icon: <File size={14} />, action: () => tabs[0] && setActiveTab(tabs[0].id) },
        ...tabs.map((t, i) => ({
            id: `tab-${t.id}`, name: `Open: ${t.fileName}`, description: t.filePath, icon: <File size={14} />, category: 'file' as const, action: () => setActiveTab(t.id),
        })),
    ];

    const filtered = query
        ? allCommands.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.description?.toLowerCase().includes(query.toLowerCase()))
        : allCommands;

    const CATEGORY_COLORS = { file: 'text-blue-400', view: 'text-gray-400', ai: 'text-purple-400', git: 'text-green-400', terminal: 'text-yellow-400' };

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                setIsOpen(prev => !prev);
                setQuery('');
                setSelected(0);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
    }, [isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
        if (e.key === 'Enter' && filtered[selected]) {
            filtered[selected].action();
            setIsOpen(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
                        onClick={() => setIsOpen(false)} />
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[600px] max-w-[92vw] z-[201] bg-panel/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.7)] overflow-hidden"
                    >
                        {/* Search bar */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                            <Command size={16} className="text-gray-500 shrink-0" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => { setQuery(e.target.value); setSelected(0); }}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a command or search files..."
                                className="flex-1 bg-transparent text-white text-[14px] outline-none placeholder-gray-600"
                            />
                            {query && (
                                <button onClick={() => setQuery('')} className="text-gray-600 hover:text-gray-400">
                                    <X size={14} />
                                </button>
                            )}
                            <kbd className="text-[10px] text-gray-600 border border-white/10 rounded px-1.5 py-0.5">ESC</kbd>
                        </div>

                        {/* Commands list */}
                        <div className="max-h-[360px] overflow-y-auto custom-scrollbar py-1">
                            {filtered.length === 0 ? (
                                <div className="px-4 py-8 text-center text-gray-600 text-[13px]">No commands found</div>
                            ) : filtered.map((cmd, i) => (
                                <div key={cmd.id}
                                    onClick={() => { cmd.action(); setIsOpen(false); }}
                                    onMouseEnter={() => setSelected(i)}
                                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${selected === i ? 'bg-accent-blue/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                                >
                                    <span className={`shrink-0 ${CATEGORY_COLORS[cmd.category]}`}>{cmd.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[13px] font-medium text-white">{cmd.name}</div>
                                        {cmd.description && <div className="text-[11px] text-gray-500 truncate">{cmd.description}</div>}
                                    </div>
                                    {cmd.shortcut && <kbd className="text-[10px] text-gray-600 border border-white/10 rounded px-1.5 py-0.5 shrink-0">{cmd.shortcut}</kbd>}
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-white/5 px-4 py-2 flex items-center gap-4 text-[10px] text-gray-600">
                            <span><kbd className="border border-white/10 rounded px-1 mr-1">↑↓</kbd>navigate</span>
                            <span><kbd className="border border-white/10 rounded px-1 mr-1">↵</kbd>select</span>
                            <span><kbd className="border border-white/10 rounded px-1 mr-1">ESC</kbd>close</span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
