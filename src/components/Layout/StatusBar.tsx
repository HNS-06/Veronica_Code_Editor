import React from 'react';
import { GitBranch, Wifi, Clock, CheckCircle2 } from 'lucide-react';
import { useTabContext } from '../../context/TabContext';
import { useIntentMode, MODE_CONFIG, IntentMode } from '../../context/IntentModeContext';

export function StatusBar() {
    const { getActiveTab, tabs } = useTabContext();
    const { mode, setMode, getModeEmoji, getModeLabel } = useIntentMode();
    const activeTab = getActiveTab();

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const modes = Object.keys(MODE_CONFIG) as IntentMode[];
    const cycleMode = () => {
        const idx = modes.indexOf(mode);
        setMode(modes[(idx + 1) % modes.length]);
    };

    return (
        <div className="h-[22px] bg-black/40 border-t border-white/5 flex items-center justify-between px-3 text-[10px] text-gray-600 shrink-0 z-30">
            {/* Left */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-green-400/70">
                    <CheckCircle2 size={9} />
                    <span>Veronica</span>
                </div>
                <div className="flex items-center gap-1">
                    <GitBranch size={9} />
                    <span>main</span>
                </div>
                {activeTab && (
                    <>
                        <span className="text-gray-700">|</span>
                        <span>{activeTab.language}</span>
                        {activeTab.isDirty && <span className="text-yellow-500/70">●</span>}
                    </>
                )}
            </div>

            {/* Center - file info */}
            {activeTab && (
                <div className="flex items-center gap-2 truncate max-w-[300px]">
                    <span className="truncate text-gray-500">{activeTab.filePath.split(/[\\/]/).slice(-2).join('/')}</span>
                </div>
            )}

            {/* Right */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                    <Wifi size={9} className="text-green-400/70" />
                    <span>AI Online</span>
                </div>
                <button
                    onClick={cycleMode}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent-purple/10 border border-accent-purple/20 text-purple-400 hover:bg-accent-purple/20 transition-colors text-[9px] font-medium"
                    title="Click to cycle AI Mode"
                >
                    {getModeEmoji()} {getModeLabel()}
                </button>
                <span>{tabs.length} tab{tabs.length !== 1 ? 's' : ''}</span>
                <div className="flex items-center gap-1">
                    <Clock size={9} />
                    <span>{timeStr}</span>
                </div>
            </div>
        </div>
    );
}
