import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSettings } from '../context/SettingsContext';
import { useIntentMode } from '../context/IntentModeContext';
import { useProjectIntelligence } from '../context/ProjectIntelligenceContext';

export interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    content: string;
}

export function useAIStream() {
    const { settings } = useSettings();
    const { getModeSystemPrompt } = useIntentMode();
    const { projectMeta } = useProjectIntelligence();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const saved = localStorage.getItem('veronica_chat_history');
            if (saved) return JSON.parse(saved);
        } catch (_) { }
        return [];
    });
    const [isStreaming, setIsStreaming] = useState(false);
    const currentMessageRef = useRef('');

    useEffect(() => {
        const newSocket = io('http://localhost:4000');
        setSocket(newSocket);

        newSocket.on('ai-stream-start', () => {
            setIsStreaming(true);
            currentMessageRef.current = '';
            setMessages(prev => [
                ...prev,
                { id: Date.now().toString(), role: 'ai', content: '' }
            ]);
        });

        newSocket.on('ai-stream-chunk', (chunk: string) => {
            currentMessageRef.current += chunk;
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg && lastMsg.role === 'ai') {
                    lastMsg.content = currentMessageRef.current;
                }
                return newMessages;
            });
        });

        newSocket.on('ai-stream-end', () => {
            setIsStreaming(false);
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Persist messages to local storage
    useEffect(() => {
        localStorage.setItem('veronica_chat_history', JSON.stringify(messages));
    }, [messages]);

    const sendMessage = (content: string, context?: any, isAgentMode?: boolean) => {
        if (!socket) return;
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content }]);
        socket.emit('ask-ai', {
            message: content,
            context,
            isAgentMode,
            model: settings.aiModel,
            geminiKey: settings.geminiKey,
            openaiKey: settings.openaiKey,
            modePrompt: getModeSystemPrompt(),
            projectMeta: projectMeta ? {
                framework: projectMeta.framework,
                language: projectMeta.language,
                architecture: projectMeta.architecture,
            } : null,
        });
    };

    const clearMessages = () => setMessages([]);

    return { messages, sendMessage, isStreaming, clearMessages };
}
