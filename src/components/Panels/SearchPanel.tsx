import React, { useState, useRef } from 'react';
import { Search as SearchIcon, X, ChevronRight, FileText } from 'lucide-react';
import { useFileContext } from '../../context/FileContext';

export function SearchPanel() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ file: string; line: number; preview: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searched, setSearched] = useState(false);
    const { openedDirPath, openFile } = useFileContext();
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setIsSearching(true);
        setSearched(true);
        setResults([]);

        try {
            if (!openedDirPath) {
                setResults([{ file: 'No workspace open', line: 0, preview: 'Open a folder to search across files.' }]);
                setIsSearching(false);
                return;
            }
            // @ts-ignore
            const dirents = await window.electronAPI.readDir(openedDirPath);
            const hits: { file: string; line: number; preview: string }[] = [];

            const searchFile = async (filePath: string, fileName: string) => {
                try {
                    // @ts-ignore
                    const content = await window.electronAPI.readFile(filePath);
                    const lines = content.split('\n');
                    lines.forEach((lineText: string, i: number) => {
                        if (lineText.toLowerCase().includes(query.toLowerCase())) {
                            hits.push({
                                file: fileName,
                                line: i + 1,
                                preview: lineText.trim().slice(0, 80)
                            });
                        }
                    });
                } catch (_) { }
            };

            for (const entry of dirents) {
                if (entry.type === 'file') {
                    await searchFile(entry.path, entry.name);
                }
            }

            setResults(hits.slice(0, 50)); // cap results
        } catch (_) {
            setResults([]);
        }
        setIsSearching(false);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-white/5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Search</span>
            </div>
            <div className="p-3">
                <div className="relative flex items-center">
                    <SearchIcon size={13} className="absolute left-3 text-gray-500" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="Search in files..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-8 pr-8 text-[12px] text-white focus:outline-none focus:border-accent-blue/50 placeholder-gray-600"
                    />
                    {query && (
                        <button onClick={() => { setQuery(''); setResults([]); setSearched(false); }} className="absolute right-2 text-gray-500 hover:text-white">
                            <X size={12} />
                        </button>
                    )}
                </div>
                <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="mt-2 w-full bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-blue rounded-lg py-1.5 text-[12px] font-medium transition-colors disabled:opacity-50"
                >
                    {isSearching ? 'Searching...' : 'Search'}
                </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {results.length > 0 ? (
                    <>
                        <div className="px-4 py-1 text-[10px] text-gray-500">{results.length} result{results.length !== 1 ? 's' : ''}</div>
                        {results.map((r, i) => (
                            <div key={i} className="px-3 py-1.5 hover:bg-white/5 cursor-pointer group" onClick={() => { }}>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <FileText size={11} className="text-accent-blue shrink-0" />
                                    <span className="text-[11px] text-gray-300 font-medium truncate">{r.file}</span>
                                    <span className="text-[10px] text-gray-600 ml-auto">:{r.line}</span>
                                </div>
                                <div className="text-[11px] text-gray-500 font-mono truncate pl-4">{r.preview}</div>
                            </div>
                        ))}
                    </>
                ) : searched && !isSearching ? (
                    <div className="text-center py-8 text-gray-600 text-[12px]">No results found for "{query}"</div>
                ) : !searched ? (
                    <div className="text-center py-8 text-gray-600 text-[12px] px-4">
                        <SearchIcon size={24} className="mx-auto mb-2 opacity-30" />
                        <p>Type to search across all files in your workspace</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
