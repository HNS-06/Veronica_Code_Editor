import React, { useState } from 'react';
import { TitleBar } from './TitleBar';
import { ActivityBar } from './ActivityBar';
import { AISidebar } from './AISidebar';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';

interface AppLayoutProps {
    children: React.ReactNode;
    onOpenChat: () => void;
    onOpenSettings: () => void;
    onOpenFile?: (filePath: string, fileName: string) => void;
}

export function AppLayout({ children, onOpenChat, onOpenSettings, onOpenFile }: AppLayoutProps) {
    const [activeTab, setActiveTab] = useState('explorer');
    const [sidebarWidth, setSidebarWidth] = useState(240);
    const [isDragging, setIsDragging] = useState(false);
    const [aiSidebarCollapsed, setAiSidebarCollapsed] = useState(true);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        document.body.style.cursor = 'col-resize';

        const handleMouseMove = (mouseEvent: MouseEvent) => {
            const newWidth = mouseEvent.clientX - 52;
            if (newWidth > 150 && newWidth < 600) setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.cursor = 'default';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className="h-full w-full flex flex-col bg-background overflow-hidden relative rounded-xl shadow-2xl">
            <TitleBar onOpenSettings={onOpenSettings} />
            <div className="flex-1 flex overflow-hidden relative min-h-0">
                {/* Background ambient lighting */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-accent-blue/5 blur-[120px]"></div>
                    <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-accent-purple/5 blur-[120px]"></div>
                </div>

                <div className="hidden md:flex h-full relative z-20">
                    {/* 1. Activity bar — far-left icon strip */}
                    <ActivityBar activeTab={activeTab} setActiveTab={setActiveTab} onOpenSettings={onOpenSettings} />

                    {/* 2. AI Sidebar — intent mode selector */}
                    <AISidebar
                        collapsed={aiSidebarCollapsed}
                        onToggle={() => setAiSidebarCollapsed(p => !p)}
                    />

                    {/* 3. File explorer / panel sidebar */}
                    <Sidebar activeTab={activeTab} width={sidebarWidth} onOpenChat={onOpenChat} onOpenFile={onOpenFile} />
                    <div
                        className={`w-[4px] -ml-[2px] z-50 cursor-col-resize flex flex-col justify-center items-center hover:bg-accent-blue/50 transition-colors ${isDragging ? 'bg-accent-blue/80' : 'bg-transparent'}`}
                        onMouseDown={handleMouseDown}
                    >
                        {isDragging && <div className="absolute w-[1px] h-full bg-accent-blue left-1/2 -translate-x-1/2 shadow-[0_0_10px_2px_rgba(59,130,246,0.5)]"></div>}
                    </div>
                </div>

                <main className="flex-1 flex flex-col bg-background/60 backdrop-blur-[2px] z-10 relative min-h-0 overflow-hidden">
                    {children}
                </main>
            </div>
            <StatusBar />
        </div>
    );
}
