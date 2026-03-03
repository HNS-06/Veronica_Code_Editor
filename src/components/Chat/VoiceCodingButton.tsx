import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceCodingButtonProps {
    onTranscript: (text: string) => void;
}

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

export function VoiceCodingButton({ onTranscript }: VoiceCodingButtonProps) {
    const [isListening, isListeningState] = useState(false);
    const [volume, setVolume] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [isSupported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    const recognitionRef = useRef<any>(null);
    const animFrameRef = useRef<number>(0);

    const startListening = useCallback(() => {
        if (!isSupported) return;

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (e: SpeechRecognitionEvent) => {
            let interim = '';
            let final = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const result = e.results[i];
                if (result.isFinal) final += result[0].transcript;
                else interim += result[0].transcript;
            }
            setTranscript(interim || final);
            if (final) onTranscript(final.trim());
        };

        recognition.onend = () => {
            isListeningState(false);
            setTranscript('');
        };

        recognition.onerror = () => {
            isListeningState(false);
            setTranscript('');
        };

        recognition.start();
        isListeningState(true);

        // Fake volume animation for visual feedback
        const animateVolume = () => {
            setVolume(Math.random() * 100);
            animFrameRef.current = requestAnimationFrame(animateVolume);
        };
        animateVolume();
    }, [isSupported, onTranscript]);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        isListeningState(false);
        cancelAnimationFrame(animFrameRef.current);
        setVolume(0);
        setTranscript('');
    }, []);

    const toggleListening = () => {
        if (isListening) stopListening();
        else startListening();
    };

    if (!isSupported) return null;

    return (
        <div className="relative">
            <motion.button
                onClick={toggleListening}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all duration-200 border ${isListening
                    ? 'bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                title={isListening ? 'Stop voice coding' : 'Start voice coding (Web Speech API)'}
            >
                {/* Pulse rings when active */}
                {isListening && (
                    <>
                        <motion.div
                            className="absolute inset-0 rounded-xl bg-red-500/10"
                            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        {/* Volume bar */}
                        <div className="absolute bottom-0 left-0 h-0.5 bg-red-400/60 rounded-full transition-all duration-75"
                            style={{ width: `${volume}%` }} />
                    </>
                )}
                {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                {isListening ? 'Stop' : 'Voice'}
            </motion.button>

            {/* Transcript bubble */}
            <AnimatePresence>
                {transcript && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.9 }}
                        className="absolute bottom-full mb-2 right-0 bg-panel/95 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 text-[12px] text-gray-300 w-64 shadow-xl z-50"
                    >
                        <div className="flex items-center gap-1.5 mb-1 text-red-400">
                            <Volume2 size={11} />
                            <span className="text-[10px]">Listening...</span>
                        </div>
                        {transcript}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
