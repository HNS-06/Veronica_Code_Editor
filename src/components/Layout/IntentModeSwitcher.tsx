import React from 'react';
import { useIntentMode, IntentMode, MODE_CONFIG } from '../../context/IntentModeContext';
import { useProjectIntelligence } from '../../context/ProjectIntelligenceContext';
import { Cpu, RefreshCw } from 'lucide-react';

export function IntentModeSwitcher() {
    const { mode, setMode, getModeEmoji } = useIntentMode();
    const { projectMeta, isAnalyzing, refresh } = useProjectIntelligence();

    const modes = Object.keys(MODE_CONFIG) as IntentMode[];

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5 shrink-0 bg-black/20">
            {/* Intent mode pills */}
            <div className="flex items-center gap-1 flex-wrap">
                {modes.map(m => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-all duration-200
                            ${mode === m
                                ? 'bg-accent-purple/20 border-accent-purple/40 text-purple-300'
                                : 'border-white/5 text-gray-600 hover:text-gray-400 hover:border-white/10'
                            }`}
                    >
                        <span>{MODE_CONFIG[m].emoji}</span>
                        {MODE_CONFIG[m].label}
                    </button>
                ))}
            </div>

            {/* Project intelligence badge */}
            <div className="ml-auto flex items-center gap-1.5 shrink-0">
                {projectMeta && (
                    <span className="text-[9px] text-gray-600 hidden lg:flex items-center gap-1">
                        <Cpu size={8} />
                        {projectMeta.framework} · {projectMeta.language}
                    </span>
                )}
                <button
                    onClick={refresh}
                    className="text-gray-700 hover:text-gray-400 transition-colors"
                    title="Re-analyze project"
                >
                    <RefreshCw size={9} className={isAnalyzing ? 'animate-spin' : ''} />
                </button>
            </div>
        </div>
    );
}
