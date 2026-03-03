import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, Bot, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useAIStream } from '../../hooks/useAIStream';
import { useFileContext } from '../../context/FileContext';
import { VoiceCodingButton } from './VoiceCodingButton';
import { useTabContext } from '../../context/TabContext';

interface AIChatPanelProps {
    onClose: () => void;
}

export function AIChatPanel({ onClose }: AIChatPanelProps) {
    const { messages, sendMessage, isStreaming, clearMessages } = useAIStream();
    const { activeFilePath, fileContent, fileName } = useFileContext();
    const { getActiveTab } = useTabContext();
    const [input, setInput] = useState('');
    const [isAgentMode, setIsAgentMode] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isStreaming) return;

        const activeTab = getActiveTab?.();
        const context = isAgentMode ? {
            fileName: activeTab?.fileName || fileName,
            code: activeTab?.content || fileContent,
            path: activeTab?.filePath || activeFilePath
        } : undefined;

        sendMessage(input, context, isAgentMode);
        setInput('');
    };

    const handleVoiceTranscript = (text: string) => {
        setInput(text);
        // Auto-send voice commands
        if (text.endsWith('.') || text.endsWith('?') || text.endsWith('!')) {
            sendMessage(text, undefined, isAgentMode);
            setInput('');
        }
    };

    return (
        <div className="flex flex-col h-full w-full glass-panel relative border-none">
            {/* Header */}
            <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-black/20 shrink-0">
                <div className="flex items-center gap-2 text-white font-medium">
                    <Sparkles className="text-accent-purple" size={16} />
                    Veronica AI
                </div>
                <div className="flex items-center gap-2">
                    <VoiceCodingButton onTranscript={handleVoiceTranscript} />
                    <button
                        onClick={() => setIsAgentMode(!isAgentMode)}
                        className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isAgentMode ? 'text-accent-purple' : 'text-gray-500 hover:text-gray-300'}`}
                        title="Agent Mode sends your current file context to the AI"
                    >
                        {isAgentMode ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        Agent
                    </button>
                    <div className="w-[1px] h-3 bg-white/10 mx-1" />
                    <button
                        onClick={clearMessages}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                        title="Clear Chat History"
                    >
                        <Trash2 size={16} />
                    </button>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors ml-1">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                        <div className="w-16 h-16 rounded-full bg-accent-purple/10 flex items-center justify-center mb-4">
                            <Bot size={32} className="text-accent-purple" />
                        </div>
                        <h3 className="text-white font-semibold mb-2">How can I help you code?</h3>
                        <p className="text-sm text-gray-400">Ask me to generate code, explain snippets, or debug errors.</p>
                        <p className="text-xs text-gray-600 mt-2">🎤 Voice coding enabled — click the Mic button!</p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={msg.id || i} className={`group flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 mb-1 px-1">
                                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                                    {msg.role === 'user' ? 'You' : 'Veronica'}
                                </span>
                            </div>
                            <div
                                className={`max-w-[90%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-accent-blue text-white shadow-[0_4px_20px_rgba(59,130,246,0.3)] rounded-tr-sm'
                                    : 'bg-white/5 text-gray-200 border border-white/10 rounded-tl-sm shadow-lg'
                                    }`}
                            >
                                {msg.content}
                                {isStreaming && msg.role === 'ai' && i === messages.length - 1 && (
                                    <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-accent-blue animate-pulse"></span>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-black/20 border-t border-white/5 shrink-0">
                <form onSubmit={handleSubmit} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isAgentMode ? 'Ask AI about your active file...' : 'Ask AI anything...'}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/50 transition-all placeholder-gray-500"
                        disabled={isStreaming}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isStreaming}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-accent-purple hover:bg-purple-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors cursor-pointer"
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
}

