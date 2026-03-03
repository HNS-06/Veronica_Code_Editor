import React from 'react';
import { Files, Search, MessageSquareCode, Settings, Puzzle, GitBranch, Bot, Brain, Network, Clock, Activity } from 'lucide-react';

interface ActivityBarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onOpenSettings: () => void;
}

export function ActivityBar({ activeTab, setActiveTab, onOpenSettings }: ActivityBarProps) {
    const topIcons = [
        { id: 'explorer', icon: Files },
        { id: 'search', icon: Search },
        { id: 'git', icon: GitBranch },
        { id: 'chat', icon: MessageSquareCode },
        { id: 'agents', icon: Bot },
        { id: 'memory', icon: Brain },
        { id: 'architecture', icon: Network },
        { id: 'health', icon: Activity },
        { id: 'timeline', icon: Clock },
        { id: 'plugins', icon: Puzzle },
    ];

    const bottomIcons = [
        { id: 'settings', icon: Settings },
    ];

    return (
        <div className="h-full w-[52px] bg-panel/80 flex flex-col items-center py-4 justify-between z-10 shrink-0">
            <div className="flex flex-col gap-3 w-full items-center">
                {topIcons.map(({ id, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${activeTab === id ? 'text-accent-blue bg-accent-blue/10 shadow-sm' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }`}
                    >
                        <Icon size={24} strokeWidth={activeTab === id ? 2.5 : 2} />
                        {activeTab === id && (
                            <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-1 h-5 bg-accent-blue rounded-r-md"></div>
                        )}
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-3 w-full items-center">
                {bottomIcons.map(({ id, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={onOpenSettings}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group relative text-gray-500 hover:text-gray-300 hover:bg-white/5`}
                    >
                        <Icon size={24} strokeWidth={2} />
                    </button>
                ))}
            </div>
        </div>
    );
}
