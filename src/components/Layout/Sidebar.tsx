import React from 'react';
import { FileExplorer } from '../Explorer/FileExplorer';
import { SearchPanel } from '../Panels/SearchPanel';
import { GitPanel } from '../Panels/GitPanel';
import { PluginsPanel } from '../Panels/PluginsPanel';
import { ChatPanel } from '../Panels/ChatPanel';
import { AgentPanel } from '../Panels/AgentPanel';
import { MemoryPanel } from '../Panels/MemoryPanel';
import { ArchitectureVisualizer } from '../Panels/ArchitectureVisualizer';
import { TimelinePanel } from '../Panels/TimelinePanel';
import { HealthDashboard } from '../Panels/HealthDashboard';

interface SidebarProps {
    activeTab: string;
    width: number;
    onOpenChat: () => void;
    onOpenFile?: (filePath: string, fileName: string) => void;
}

export function Sidebar({ activeTab, width, onOpenChat, onOpenFile }: SidebarProps) {
    const renderPanel = () => {
        switch (activeTab) {
            case 'explorer': return <FileExplorer onOpenFile={onOpenFile} />;
            case 'search': return <SearchPanel />;
            case 'git': return <GitPanel />;
            case 'chat': return <ChatPanel onOpenChat={onOpenChat} />;
            case 'agents': return <AgentPanel />;
            case 'memory': return <MemoryPanel />;
            case 'architecture': return <ArchitectureVisualizer />;
            case 'plugins': return <PluginsPanel />;
            case 'timeline': return <TimelinePanel />;
            case 'health': return <HealthDashboard />;
            default: return (
                <div className="flex-1 flex items-center justify-center text-gray-600 text-[12px]">
                    Panel not found
                </div>
            );
        }
    };

    return (
        <div
            className="h-full bg-panel/40 border-r border-white/5 flex flex-col backdrop-blur-md z-10 overflow-hidden shrink-0 transition-[width] duration-0"
            style={{ width }}
        >
            {renderPanel()}
        </div>
    );
}
