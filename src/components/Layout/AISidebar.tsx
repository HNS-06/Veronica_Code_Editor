import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Cpu } from 'lucide-react';
import { useIntentMode, IntentMode, MODE_CONFIG } from '../../context/IntentModeContext';
import { useProjectIntelligence } from '../../context/ProjectIntelligenceContext';

const MODE_ICONS: Record<IntentMode, string> = {
    build: '🔨',
    refactor: '♻️',
    learn: '📚',
    secure: '🛡️',
    optimize: '⚡',
};

const MODE_COLORS: Record<IntentMode, string> = {
    build: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-300',
    refactor: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-300',
    learn: 'from-green-500/20 to-emerald-500/10 border-green-500/30 text-green-300',
    secure: 'from-yellow-500/20 to-orange-500/10 border-yellow-500/30 text-yellow-300',
    optimize: 'from-orange-500/20 to-red-500/10 border-orange-500/30 text-orange-300',
};

const MODE_GLOW: Record<IntentMode, string> = {
    build: 'shadow-[0_0_12px_rgba(59,130,246,0.3)]',
    refactor: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]',
    learn: 'shadow-[0_0_12px_rgba(34,197,94,0.3)]',
    secure: 'shadow-[0_0_12px_rgba(234,179,8,0.3)]',
    optimize: 'shadow-[0_0_12px_rgba(249,115,22,0.3)]',
};

interface AISidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export function AISidebar({ collapsed, onToggle }: AISidebarProps) {
    const { mode, setMode } = useIntentMode();
    const { projectMeta, isAnalyzing } = useProjectIntelligence();
    const [hoveredMode, setHoveredMode] = useState<IntentMode | null>(null);

    const modes = Object.keys(MODE_CONFIG) as IntentMode[];

    return (
        <motion.div
            animate={{ width: collapsed ? 48 : 220 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="h-full shrink-0 flex flex-col relative z-20 overflow-hidden"
            style={{
                background: 'rgba(10, 10, 20, 0.6)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {/* Toggle button */}
            <div className="flex items-center justify-between px-2 py-3 shrink-0 border-b border-white/5">
                <AnimatePresence>
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.18 }}
                            className="text-[9px] font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap pl-1"
                        >
                            AI Mode
                        </motion.span>
                    )}
                </AnimatePresence>
                <button
                    onClick={onToggle}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all duration-150 shrink-0 ml-auto"
                    title={collapsed ? 'Expand AI Sidebar' : 'Collapse AI Sidebar'}
                >
                    {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
                </button>
            </div>

            {/* Mode buttons */}
            <div className="flex-1 flex flex-col gap-1 p-1.5 overflow-y-auto scrollbar-none">
                {modes.map((m) => {
                    const isActive = mode === m;
                    const config = MODE_CONFIG[m];

                    return (
                        <div key={m} className="relative group">
                            {/* Tooltip for collapsed state */}
                            {collapsed && (
                                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
                                    <div className="bg-gray-900 border border-white/10 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl">
                                        {MODE_ICONS[m]} {config.label}
                                        <div className="text-[9px] text-gray-500 mt-0.5 max-w-[160px]">
                                            {config.prompt.split('.')[0]}.
                                        </div>
                                    </div>
                                </div>
                            )}

                            <motion.button
                                onClick={() => setMode(m)}
                                onMouseEnter={() => setHoveredMode(m)}
                                onMouseLeave={() => setHoveredMode(null)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                className={`w-full flex items-center gap-2.5 rounded-xl border transition-all duration-200 relative overflow-hidden
                                    ${collapsed ? 'justify-center px-0 py-2.5' : 'px-2.5 py-2.5'}
                                    ${isActive
                                        ? `bg-gradient-to-r ${MODE_COLORS[m]} ${MODE_GLOW[m]}`
                                        : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/8 text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                {/* Active mode animated glow bg */}
                                {isActive && (
                                    <motion.div
                                        layoutId="mode-glow"
                                        className="absolute inset-0 rounded-xl"
                                        style={{ background: 'inherit' }}
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                                    />
                                )}

                                {/* Emoji icon */}
                                <span className="text-base relative z-10 shrink-0">{MODE_ICONS[m]}</span>

                                {/* Label & description (expanded only) */}
                                <AnimatePresence>
                                    {!collapsed && (
                                        <motion.div
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col items-start overflow-hidden text-left relative z-10"
                                        >
                                            <span className={`text-[11px] font-semibold whitespace-nowrap leading-tight
                                                ${isActive ? '' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                                {config.label}
                                            </span>
                                            <span className="text-[9px] text-gray-600 whitespace-nowrap mt-0.5 leading-tight">
                                                {m === 'build' && 'Generate & scaffold'}
                                                {m === 'refactor' && 'Improve code quality'}
                                                {m === 'learn' && 'Explain & document'}
                                                {m === 'secure' && 'Find vulnerabilities'}
                                                {m === 'optimize' && 'Boost performance'}
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Active indicator dot (collapsed) */}
                                {collapsed && isActive && (
                                    <motion.div
                                        layoutId="active-dot"
                                        className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-current opacity-70"
                                    />
                                )}
                            </motion.button>
                        </div>
                    );
                })}
            </div>

            {/* Project meta badge (expanded only) */}
            <AnimatePresence>
                {!collapsed && projectMeta && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="px-3 py-2.5 border-t border-white/5 shrink-0"
                    >
                        <div className="flex items-center gap-1.5 text-[9px] text-gray-600">
                            <Cpu size={8} className={isAnalyzing ? 'animate-pulse' : ''} />
                            <span className="truncate">{projectMeta.framework} · {projectMeta.language}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
