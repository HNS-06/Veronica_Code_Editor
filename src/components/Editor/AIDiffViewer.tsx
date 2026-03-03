import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, GitBranch, Loader } from 'lucide-react';
import { useTabContext } from '../../context/TabContext';

interface AIDiffViewerProps {
    isOpen: boolean;
    original: string;
    modified: string;
    fileName: string;
    onAccept: (newContent: string) => void;
    onReject: () => void;
}

export function AIDiffViewer({ isOpen, original, modified, fileName, onAccept, onReject }: AIDiffViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const diffEditorRef = useRef<any>(null);

    useEffect(() => {
        if (!isOpen || !containerRef.current) return;

        // Dynamically import monaco to avoid SSR issues
        import('monaco-editor').then(monaco => {
            if (!containerRef.current) return;
            if (diffEditorRef.current) {
                diffEditorRef.current.dispose();
            }

            const ext = fileName.split('.').pop() || 'plaintext';
            const langMap: Record<string, string> = {
                ts: 'typescript', tsx: 'typescript', js: 'javascript', py: 'python',
                rs: 'rust', go: 'go', css: 'css', json: 'json', md: 'markdown'
            };
            const language = langMap[ext] || 'plaintext';

            diffEditorRef.current = monaco.editor.createDiffEditor(containerRef.current, {
                theme: 'vs-dark',
                readOnly: true,
                renderSideBySide: true,
                minimap: { enabled: false },
                fontSize: 12,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                renderOverviewRuler: false,
            });

            diffEditorRef.current.setModel({
                original: monaco.editor.createModel(original, language),
                modified: monaco.editor.createModel(modified, language),
            });
        });

        return () => {
            diffEditorRef.current?.dispose();
            diffEditorRef.current = null;
        };
    }, [isOpen, original, modified, fileName]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[190]"
                        onClick={onReject} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-[3%] z-[191] bg-panel/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 shrink-0">
                            <div className="flex items-center gap-2">
                                <GitBranch size={15} className="text-accent-purple" />
                                <span className="text-white font-medium text-[13px]">AI Edit Preview</span>
                                <span className="text-gray-500 text-[11px]">— {fileName}</span>
                                <span className="text-[10px] bg-accent-purple/10 text-accent-purple border border-accent-purple/20 px-2 py-0.5 rounded-full">Review changes before applying</span>
                            </div>
                            <button onClick={onReject} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors">
                                <X size={15} />
                            </button>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 px-5 py-2 border-b border-white/5 shrink-0 text-[11px]">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-red-500/30 border border-red-500/50" /> Original</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-green-500/30 border border-green-500/50" /> AI Modified</span>
                        </div>

                        {/* Diff editor */}
                        <div ref={containerRef} className="flex-1 overflow-hidden" />

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-white/5 shrink-0">
                            <button onClick={onReject}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] text-gray-400 hover:text-white hover:bg-white/10 transition-colors border border-white/10">
                                <X size={14} /> Reject Changes
                            </button>
                            <button onClick={() => onAccept(modified)}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] text-white bg-gradient-to-r from-green-600/80 to-green-500/80 hover:from-green-500 hover:to-green-400 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                                <Check size={14} /> Apply Changes
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/**
 * Hook to trigger AI Edit Mode from the chat panel.
 */
export function useAIDiffMode() {
    const [diffState, setDiffState] = useState<{
        isOpen: boolean;
        original: string;
        modified: string;
        fileName: string;
    }>({ isOpen: false, original: '', modified: '', fileName: '' });
    const { getActiveTab, updateTabContent } = useTabContext();

    const requestAIEdit = async (instruction: string) => {
        const tab = getActiveTab();
        if (!tab) return;

        try {
            const res = await fetch('http://localhost:4000/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent: 'refactor',
                    code: tab.content,
                    fileName: tab.fileName,
                    language: tab.language,
                    userMessage: instruction,
                }),
            });
            const data = await res.json();
            // Extract code block from response
            const codeMatch = data.result?.match(/```[\w]*\n([\s\S]*?)```/);
            const modified = codeMatch ? codeMatch[1] : data.result;

            if (modified && modified !== tab.content) {
                setDiffState({ isOpen: true, original: tab.content, modified, fileName: tab.fileName });
            }
        } catch (e) { console.error(e); }
    };

    const applyEdit = (newContent: string) => {
        const tab = getActiveTab();
        if (tab) updateTabContent(tab.id, newContent);
        setDiffState(s => ({ ...s, isOpen: false }));
    };

    const rejectEdit = () => setDiffState(s => ({ ...s, isOpen: false }));

    return { diffState, requestAIEdit, applyEdit, rejectEdit };
}
