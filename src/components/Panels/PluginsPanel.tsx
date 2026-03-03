import React, { useState } from 'react';
import { Puzzle, ExternalLink, Download, Star, CheckCircle } from 'lucide-react';

const PLUGINS = [
    { id: 'prettier', name: 'Prettier', description: 'Code formatter for consistent style', version: '3.2.5', stars: '46k', author: 'prettier', installed: false, category: 'Formatter' },
    { id: 'eslint', name: 'ESLint', description: 'Find and fix problems in JavaScript code', version: '8.57.0', stars: '24k', author: 'eslint', installed: false, category: 'Linter' },
    { id: 'gitlens', name: 'GitLens', description: 'Supercharge Git capabilities', version: '15.0.0', stars: '10k', author: 'gitkraken', installed: false, category: 'Git' },
    { id: 'copilot', name: 'AI Autocomplete', description: 'Powered by Veronica AI engine', version: '1.0.0', stars: '∞', author: 'veronica', installed: true, category: 'AI' },
    { id: 'tailwindcss', name: 'Tailwind CSS IntelliSense', description: 'Autocomplete, syntax highlighting and linting', version: '0.10.5', stars: '8k', author: 'tailwindlabs', installed: false, category: 'CSS' },
    { id: 'material-icons', name: 'Material Icon Theme', description: 'Material Design icons for VS Code', version: '5.1.3', stars: '17k', author: 'pkief', installed: false, category: 'Theme' },
    { id: 'docker', name: 'Docker', description: 'Build, manage & deploy containerized apps', version: '1.29.0', stars: '6k', author: 'microsoft', installed: false, category: 'DevOps' },
    { id: 'rest-client', name: 'REST Client', description: 'REST API client for testing endpoints', version: '0.25.1', stars: '5k', author: 'humao', installed: false, category: 'API' },
];

const CATEGORIES = ['All', 'AI', 'Formatter', 'Linter', 'Git', 'CSS', 'Theme', 'DevOps', 'API'];

export function PluginsPanel() {
    const [installed, setInstalled] = useState<Set<string>>(new Set(['copilot']));
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');

    const filtered = PLUGINS.filter(p =>
        (filter === 'All' || p.category === filter) &&
        (p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
    );

    const toggle = (id: string) => {
        setInstalled(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-white/5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Extensions</span>
            </div>
            <div className="p-3 space-y-2">
                <input
                    type="text"
                    placeholder="Search extensions..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-[12px] text-white focus:outline-none focus:border-accent-blue/50 placeholder-gray-600"
                />
                <div className="flex gap-1 flex-wrap">
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setFilter(cat)}
                            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${filter === cat ? 'border-accent-blue/50 text-accent-blue bg-accent-blue/10' : 'border-white/10 text-gray-500 hover:text-gray-300'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filtered.map(plugin => (
                    <div key={plugin.id} className="px-3 py-3 hover:bg-white/5 border-b border-white/[0.03]">
                        <div className="flex items-start justify-between gap-2">
                            <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center shrink-0">
                                <Puzzle size={15} className="text-accent-blue" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[12px] font-medium text-white">{plugin.name}</span>
                                    <span className="text-[9px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">{plugin.version}</span>
                                </div>
                                <p className="text-[10px] text-gray-500 leading-relaxed">{plugin.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-gray-600">{plugin.author}</span>
                                    <span className="flex items-center gap-0.5 text-[10px] text-gray-600"><Star size={9} />{plugin.stars}</span>
                                    <span className="text-[9px] text-gray-700 bg-white/5 px-1 py-0.5 rounded">{plugin.category}</span>
                                </div>
                            </div>
                            <button onClick={() => toggle(plugin.id)}
                                className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${installed.has(plugin.id)
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                                    : 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20 hover:bg-accent-blue/20'}`}
                            >
                                {installed.has(plugin.id) ? <><CheckCircle size={10} className="inline mr-0.5" />Installed</> : <><Download size={10} className="inline mr-0.5" />Install</>}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
