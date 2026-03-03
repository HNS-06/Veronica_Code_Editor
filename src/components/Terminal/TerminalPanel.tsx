import React, { useState } from 'react';
import { Plus, X, Terminal as TerminalIcon, Minus } from 'lucide-react';
import { XTerminal } from './XTerminal';
import { motion, AnimatePresence } from 'framer-motion';

interface TerminalTab {
    id: string;
    name: string;
}

interface TerminalPanelProps {
    isVisible: boolean;
    onToggle: () => void;
    height: number;
    onHeightChange: (h: number) => void;
}

export function TerminalPanel({ isVisible, onToggle, height, onHeightChange }: TerminalPanelProps) {
    const [tabs, setTabs] = useState<TerminalTab[]>([{ id: 'term-1', name: 'bash 1' }]);
    const [activeTerm, setActiveTerm] = useState('term-1');
    const [isDragging, setIsDragging] = useState(false);

    const addTerminal = () => {
        const id = `term-${Date.now()}`;
        const name = `bash ${tabs.length + 1}`;
        setTabs(prev => [...prev, { id, name }]);
        setActiveTerm(id);
    };

    const closeTerminal = (id: string) => {
        const remaining = tabs.filter(t => t.id !== id);
        if (remaining.length === 0) { onToggle(); return; }
        setTabs(remaining);
        if (activeTerm === id) setActiveTerm(remaining[remaining.length - 1].id);
    };

    const handleDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        const startY = e.clientY;
        const startH = height;

        const onMove = (ev: MouseEvent) => {
            const delta = startY - ev.clientY;
            const newH = Math.min(600, Math.max(120, startH + delta));
            onHeightChange(newH);
        };
        const onUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.body.style.cursor = 'row-resize';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', () => { document.body.style.cursor = 'default'; onUp(); });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="border-t border-white/10 bg-black/40 backdrop-blur-xl flex flex-col shrink-0 overflow-hidden"
                    style={{ height }}
                >
                    {/* Drag handle */}
                    <div
                        className={`h-[4px] cursor-row-resize hover:bg-accent-purple/50 transition-colors shrink-0 ${isDragging ? 'bg-accent-purple/80' : 'bg-transparent'}`}
                        onMouseDown={handleDragStart}
                    />

                    {/* Tab bar */}
                    <div className="flex items-center border-b border-white/5 bg-black/20 shrink-0 h-9 px-2 gap-1">
                        <div className="flex items-center gap-0.5">
                            <TerminalIcon size={13} className="text-accent-purple mr-1.5" />
                            {tabs.map(tab => (
                                <div key={tab.id} onClick={() => setActiveTerm(tab.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] cursor-pointer transition-colors ${activeTerm === tab.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                                    {tab.name}
                                    <button onClick={e => { e.stopPropagation(); closeTerminal(tab.id); }}
                                        className="hover:text-red-400 transition-colors">
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                            <button onClick={addTerminal} className="p-1 text-gray-600 hover:text-gray-300 hover:bg-white/5 rounded transition-colors">
                                <Plus size={12} />
                            </button>
                        </div>
                        <div className="ml-auto">
                            <button onClick={onToggle} className="p-1 text-gray-600 hover:text-gray-300 hover:bg-white/5 rounded transition-colors">
                                <Minus size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Terminal instances */}
                    <div className="flex-1 overflow-hidden relative">
                        {tabs.map(tab => (
                            <div key={tab.id} className="absolute inset-0" style={{ display: activeTerm === tab.id ? 'block' : 'none' }}>
                                <XTerminal id={tab.id} isActive={activeTerm === tab.id} />
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
