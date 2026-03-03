import React from 'react';
import { Clock, Bot, RefreshCw, Trash2, FileCode, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAITimeline, AIAction } from '../../context/AITimelineContext';
import { useTabContext } from '../../context/TabContext';

const ACTION_ICONS: Record<AIAction['actionType'], React.ReactNode> = {
    chat: <Bot size={10} className="text-purple-400" />,
    refactor: <RefreshCw size={10} className="text-blue-400" />,
    debug: <AlertTriangle size={10} className="text-red-400" />,
    docgen: <FileCode size={10} className="text-green-400" />,
    testgen: <FileCode size={10} className="text-green-400" />,
    security: <AlertTriangle size={10} className="text-yellow-400" />,
    explain: <Bot size={10} className="text-pink-400" />,
    complete: <Bot size={10} className="text-cyan-400" />,
    other: <Bot size={10} className="text-gray-400" />,
};

export function TimelinePanel() {
    const { timeline, clearTimeline } = useAITimeline();
    const { updateTabContent, getActiveTab } = useTabContext();

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const handleRevert = (action: AIAction) => {
        if (!action.snapshotBefore) {
            alert('No snapshot available to revert to for this action.');
            return;
        }
        const tab = getActiveTab();
        if (!tab) { alert('No active file.'); return; }
        if (confirm(`Revert to the state before "${action.description}"?`)) {
            updateTabContent(tab.id, action.snapshotBefore);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Clock size={13} className="text-accent-purple" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AI Timeline</span>
                </div>
                {timeline.length > 0 && (
                    <button onClick={clearTimeline} className="text-gray-600 hover:text-red-400 transition-colors" title="Clear Timeline">
                        <Trash2 size={12} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2">
                <AnimatePresence>
                    {timeline.length === 0 ? (
                        <div className="text-center py-10 text-gray-600 text-[11px]">
                            <Clock size={24} className="mx-auto mb-2 opacity-20" />
                            <p>No AI actions yet.</p>
                            <p className="text-[10px] mt-1">Actions will appear here as you use AI features.</p>
                        </div>
                    ) : (
                        [...timeline].reverse().map((action) => (
                            <motion.div
                                key={action.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="group flex items-start gap-2 p-2.5 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all"
                            >
                                <div className="mt-0.5 shrink-0">
                                    {ACTION_ICONS[action.actionType]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-gray-300 leading-snug truncate">{action.description}</p>
                                    {action.filePath && (
                                        <p className="text-[9px] text-gray-600 mt-0.5 truncate">{action.filePath.split(/[\\/]/).pop()}</p>
                                    )}
                                    <p className="text-[9px] text-gray-700 mt-0.5">{formatTime(action.timestamp)}</p>
                                </div>
                                {action.snapshotBefore && (
                                    <button
                                        onClick={() => handleRevert(action)}
                                        className="shrink-0 opacity-0 group-hover:opacity-100 text-[9px] text-gray-500 hover:text-yellow-400 transition-all px-1.5 py-0.5 rounded border border-white/5 hover:border-yellow-400/30"
                                    >
                                        Revert
                                    </button>
                                )}
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {timeline.length > 0 && (
                <div className="px-4 py-2 border-t border-white/5 text-[9px] text-gray-700 shrink-0">
                    {timeline.length} action{timeline.length !== 1 ? 's' : ''} logged
                </div>
            )}
        </div>
    );
}
