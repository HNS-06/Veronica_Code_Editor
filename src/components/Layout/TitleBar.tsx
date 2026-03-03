import React from 'react';
import { Settings, Terminal } from 'lucide-react';

interface TitleBarProps {
    onOpenSettings: () => void;
}

export function TitleBar({ onOpenSettings }: TitleBarProps) {
    const handleControl = (action: string) => {
        // @ts-ignore
        if (window.electronAPI) {
            // @ts-ignore
            window.electronAPI.windowControl(action);
        }
    };

    return (
        <div className="h-9 w-full bg-panel flex items-center justify-between px-4 titlebar-drag-region border-b border-white/5 z-50">
            <div className="flex items-center gap-[0.4rem]">
                <button onClick={() => handleControl('close')} className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 no-drag transition-colors"></button>
                <button onClick={() => handleControl('minimize')} className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 no-drag transition-colors"></button>
                <button onClick={() => handleControl('maximize')} className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/80 no-drag transition-colors"></button>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-gray-400">
                <svg fill="none" height="14" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg" className="text-accent-blue">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                Veronica
            </div>
            <div className="flex items-center gap-1 no-drag">
                <button onClick={onOpenSettings} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors" title="Settings">
                    <Settings size={13} />
                </button>
            </div>
        </div>
    );
}
