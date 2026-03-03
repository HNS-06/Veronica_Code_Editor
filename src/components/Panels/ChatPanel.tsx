import React from 'react';
import { MessageSquareCode, Sparkles, Bot } from 'lucide-react';

interface ChatPanelProps {
    onOpenChat: () => void;
}

export function ChatPanel({ onOpenChat }: ChatPanelProps) {
    const tips = [
        'Ask me to explain selected code',
        'Say "debug this function" to find issues',
        'Request code refactors and improvements',
        'Ask to generate unit tests for your code',
        'Enable Agent Mode to analyze your entire file',
    ];

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-white/5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Veronica AI</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-5 gap-5">
                <div className="w-14 h-14 rounded-2xl bg-accent-purple/10 flex items-center justify-center border border-accent-purple/20">
                    <Bot size={28} className="text-accent-purple" />
                </div>
                <div className="text-center">
                    <h3 className="text-white font-semibold text-sm mb-1">Veronica AI Assistant</h3>
                    <p className="text-gray-500 text-[11px] leading-relaxed">Powered by Gemini. Ask anything about your code.</p>
                </div>
                <button onClick={onOpenChat}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent-blue/20 to-accent-purple/20 hover:from-accent-blue/30 hover:to-accent-purple/30 border border-white/10 text-white rounded-xl py-2.5 text-[13px] font-medium transition-all">
                    <Sparkles size={15} className="text-accent-purple" />
                    Open Chat Panel
                </button>
                <div className="w-full space-y-2">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest">Quick prompts</p>
                    {tips.map((tip, i) => (
                        <button key={i} onClick={onOpenChat}
                            className="w-full text-left text-[11px] text-gray-400 hover:text-white py-1.5 px-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 flex items-center gap-2">
                            <MessageSquareCode size={11} className="text-accent-blue shrink-0" />
                            {tip}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
