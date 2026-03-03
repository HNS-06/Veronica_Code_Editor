import React, { useState, useCallback } from 'react';
import { Brain, Plus, Search, Trash2, FileText, Lightbulb, GitCommit, StickyNote, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { workspaceMemory } from '../../services/WorkspaceMemory';

type MemoryType = 'all' | 'note' | 'decision' | 'file';

export function MemoryPanel() {
    const [entries, setEntries] = React.useState(() => workspaceMemory.getAll());
    const [filter, setFilter] = React.useState<MemoryType>('all');
    const [search, setSearch] = React.useState('');
    const [addingNote, setAddingNote] = React.useState(false);
    const [noteText, setNoteText] = React.useState('');
    const [noteType, setNoteType] = React.useState<'note' | 'decision'>('note');

    const refresh = () => setEntries(workspaceMemory.getAll());

    const filtered = search
        ? workspaceMemory.search(search)
        : entries.filter(e => filter === 'all' || e.type === filter);

    const addNote = () => {
        if (!noteText.trim()) return;
        if (noteType === 'decision') workspaceMemory.addDecision(noteText.trim());
        else workspaceMemory.addNote(noteText.trim());
        setNoteText('');
        setAddingNote(false);
        refresh();
    };

    const removeEntry = (id: string) => {
        workspaceMemory.remove(id);
        refresh();
    };

    const clearAll = () => {
        if (confirm('Clear all workspace memory?')) {
            workspaceMemory.clear();
            refresh();
        }
    };

    const TYPE_ICONS: Record<string, React.ReactNode> = {
        note: <StickyNote size={11} className="text-yellow-400" />,
        decision: <Lightbulb size={11} className="text-purple-400" />,
        file: <FileText size={11} className="text-blue-400" />,
        snippet: <GitCommit size={11} className="text-green-400" />,
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Brain size={13} className="text-accent-purple" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Workspace Memory</span>
                    <span className="text-[10px] bg-accent-purple/10 text-accent-purple px-1.5 py-0.5 rounded-full">{entries.length}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setAddingNote(true)} className="p-1 text-gray-600 hover:text-white hover:bg-white/10 rounded transition-colors" title="Add note">
                        <Plus size={13} />
                    </button>
                    {entries.length > 0 && (
                        <button onClick={clearAll} className="p-1 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Clear all">
                            <Trash2 size={13} />
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="px-3 py-2 border-b border-white/5">
                <div className="flex items-center gap-2 bg-black/20 rounded-lg border border-white/5 px-2.5 py-1.5">
                    <Search size={11} className="text-gray-600 shrink-0" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search memory..."
                        className="flex-1 bg-transparent text-[12px] text-white outline-none placeholder-gray-600" />
                </div>
            </div>

            {/* Filters */}
            {!search && (
                <div className="flex gap-1 px-3 py-1.5 border-b border-white/5">
                    {(['all', 'note', 'decision', 'file'] as MemoryType[]).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] transition-colors capitalize ${filter === f ? 'bg-accent-purple/20 text-accent-purple' : 'text-gray-500 hover:text-gray-300'}`}>
                            {f}
                        </button>
                    ))}
                </div>
            )}

            {/* Add note input */}
            <AnimatePresence>
                {addingNote && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="border-b border-white/5 overflow-hidden">
                        <div className="p-3 space-y-2">
                            <div className="flex gap-2">
                                {(['note', 'decision'] as const).map(t => (
                                    <button key={t} onClick={() => setNoteType(t)}
                                        className={`flex-1 py-1 rounded-lg text-[11px] transition-colors capitalize ${noteType === t ? 'bg-accent-purple/20 text-accent-purple' : 'text-gray-500 hover:bg-white/5'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                            <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                                placeholder={noteType === 'decision' ? 'Record an architectural decision...' : 'Add a note about this workspace...'}
                                rows={3}
                                className="w-full bg-black/30 text-[12px] text-white rounded-lg border border-white/10 p-2.5 outline-none resize-none placeholder-gray-600 focus:border-accent-purple/50" />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setAddingNote(false)} className="text-[11px] text-gray-500 hover:text-white px-2 py-1 transition-colors">Cancel</button>
                                <button onClick={addNote} className="text-[11px] bg-accent-purple/20 text-accent-purple px-3 py-1 rounded-lg hover:bg-accent-purple/30 transition-colors">Save</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Entries */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                {filtered.length === 0 ? (
                    <div className="text-center py-8 text-gray-600 text-[12px]">
                        <Brain size={24} className="mx-auto mb-2 opacity-30" />
                        <p>{search ? 'No memory matches found' : 'No memories yet. Add notes or decisions!'}</p>
                    </div>
                ) : filtered.map(entry => (
                    <motion.div key={entry.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className="group flex items-start gap-2 p-2.5 bg-white/5 hover:bg-white/8 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                        <div className="shrink-0 mt-0.5">{TYPE_ICONS[entry.type]}</div>
                        <div className="flex-1 min-w-0">
                            {entry.fileName && <div className="text-[10px] text-gray-500 mb-0.5 truncate">{entry.fileName}</div>}
                            <div className="text-[11px] text-gray-300 leading-relaxed line-clamp-3">{entry.content}</div>
                            <div className="text-[10px] text-gray-600 mt-1">{new Date(entry.timestamp).toLocaleDateString()}</div>
                        </div>
                        <button onClick={() => removeEntry(entry.id)}
                            className="shrink-0 p-0.5 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">
                            <X size={11} />
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
