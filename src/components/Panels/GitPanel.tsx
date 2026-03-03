import React, { useState, useEffect, useRef } from 'react';
import { GitBranch, RefreshCw, ExternalLink, Globe, Lock, Star, GitFork } from 'lucide-react';

interface Repo {
    id: number;
    name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    forks_count: number;
    language: string | null;
    private: boolean;
    updated_at: string;
}

export function GitPanel() {
    const [token, setToken] = useState('');
    const [savedToken, setSavedToken] = useState(localStorage.getItem('gh_token') || '');
    const [repos, setRepos] = useState<Repo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState<{ login: string; avatar_url: string } | null>(null);

    const fetchRepos = async (tok: string) => {
        if (!tok) return;
        setLoading(true);
        setError('');
        try {
            const headers = { Authorization: `token ${tok}`, Accept: 'application/vnd.github.v3+json' };
            const userRes = await fetch('https://api.github.com/user', { headers });
            if (!userRes.ok) { setError('Invalid token. Please check your GitHub PAT.'); setLoading(false); return; }
            const userData = await userRes.json();
            setUser(userData);
            const reposRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=30', { headers });
            const reposData = await reposRes.json();
            setRepos(reposData);
            localStorage.setItem('gh_token', tok);
            setSavedToken(tok);
        } catch {
            setError('Network error. Please try again.');
        }
        setLoading(false);
    };

    useEffect(() => {
        if (savedToken) fetchRepos(savedToken);
    }, []);

    const LangColor: Record<string, string> = {
        TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', Rust: '#dea584',
        Go: '#00ADD8', Java: '#b07219', CSS: '#563d7c', HTML: '#e34c26', Shell: '#89e051'
    };

    if (!savedToken) {
        return (
            <div className="flex flex-col h-full">
                <div className="px-4 py-3 border-b border-white/5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">GitHub</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
                    <GitBranch size={32} className="text-gray-600" />
                    <p className="text-[12px] text-gray-400 text-center">Connect your GitHub account to view repositories</p>
                    <a href="https://github.com/settings/tokens/new?scopes=repo,read:user" target="_blank" rel="noreferrer"
                        className="text-[11px] text-accent-blue hover:underline flex items-center gap-1">
                        <ExternalLink size={11} /> Generate a Personal Access Token
                    </a>
                    <input
                        type="password"
                        placeholder="Paste your GitHub PAT..."
                        value={token}
                        onChange={e => setToken(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-[12px] text-white focus:outline-none focus:border-accent-blue/50 placeholder-gray-600"
                    />
                    <button onClick={() => fetchRepos(token)} disabled={!token || loading}
                        className="w-full bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-blue rounded-lg py-2 text-[12px] font-medium transition-colors disabled:opacity-50">
                        Connect to GitHub
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {user?.avatar_url && <img src={user.avatar_url} className="w-5 h-5 rounded-full" />}
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{user?.login || 'GitHub'}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => fetchRepos(savedToken)} className="text-gray-500 hover:text-white transition-colors" title="Refresh">
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => { setSavedToken(''); setUser(null); setRepos([]); localStorage.removeItem('gh_token'); }}
                        className="text-gray-500 hover:text-red-400 text-[10px] transition-colors" title="Sign Out">✕</button>
                </div>
            </div>
            {error && <p className="px-4 py-2 text-red-400 text-[11px]">{error}</p>}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
                {repos.map(repo => (
                    <div key={repo.id} className="px-3 py-2.5 hover:bg-white/5 cursor-pointer group border-b border-white/[0.03]">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    {repo.private ? <Lock size={10} className="text-gray-500 shrink-0" /> : <Globe size={10} className="text-gray-600 shrink-0" />}
                                    <a href={repo.html_url} target="_blank" rel="noreferrer"
                                        className="text-[12px] font-medium text-accent-blue hover:underline truncate"
                                        onClick={e => e.stopPropagation()}>
                                        {repo.name}
                                    </a>
                                </div>
                                {repo.description && <p className="text-[10px] text-gray-500 leading-relaxed truncate mb-1.5">{repo.description}</p>}
                                <div className="flex items-center gap-3 text-[10px] text-gray-600">
                                    {repo.language && (
                                        <span className="flex items-center gap-0.5">
                                            <span className="w-2 h-2 rounded-full inline-block" style={{ background: LangColor[repo.language] || '#888' }} />
                                            {repo.language}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-0.5"><Star size={9} />{repo.stargazers_count}</span>
                                    <span className="flex items-center gap-0.5"><GitFork size={9} />{repo.forks_count}</span>
                                </div>
                            </div>
                            <a href={repo.html_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded">
                                <ExternalLink size={11} className="text-gray-500" />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
