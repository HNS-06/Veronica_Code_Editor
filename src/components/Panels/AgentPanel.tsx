import React, { useState, useRef } from 'react';
import { Bot, Bug, RefreshCw, Shield, TestTube, BookOpen, GitCommit, Zap, ChevronDown, Sparkles, Copy, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentType, AGENTS } from '../../agents/agentPrompts';
import { useTabContext } from '../../context/TabContext';
import { useSettings } from '../../context/SettingsContext';

interface Agent {
    id: AgentType;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    actionLabel: string;
}

const AGENT_LIST: Agent[] = [
    { id: 'debug', name: 'Debug', description: 'Find bugs and root causes', icon: <Bug size={15} />, color: 'text-red-400', actionLabel: 'Analyze Bugs' },
    { id: 'refactor', name: 'Refactor', description: 'Improve code quality', icon: <RefreshCw size={15} />, color: 'text-blue-400', actionLabel: 'Refactor Code' },
    { id: 'security', name: 'Security', description: 'Find vulnerabilities', icon: <Shield size={15} />, color: 'text-yellow-400', actionLabel: 'Security Audit' },
    { id: 'testgen', name: 'Test Generator', description: 'Generate unit tests', icon: <TestTube size={15} />, color: 'text-green-400', actionLabel: 'Generate Tests' },
    { id: 'docgen', name: 'Doc Generator', description: 'Add documentation', icon: <BookOpen size={15} />, color: 'text-purple-400', actionLabel: 'Add JSDoc' },
    { id: 'commit', name: 'Commit AI', description: 'Generate commit message', icon: <GitCommit size={15} />, color: 'text-orange-400', actionLabel: 'Generate Message' },
    { id: 'health', name: 'Code Health', description: 'Score code quality (0-100)', icon: <Zap size={15} />, color: 'text-cyan-400', actionLabel: 'Analyze Health' },
    { id: 'explain', name: 'Explain', description: 'Explain code in plain English', icon: <Sparkles size={15} />, color: 'text-pink-400', actionLabel: 'Explain Code' },
];

interface AgentResult {
    agent: AgentType;
    content: string;
    isHealth?: boolean;
    healthData?: any;
}

export function AgentPanel() {
    const { settings } = useSettings();
    const [result, setResult] = useState<AgentResult | null>(null);
    const [loading, setLoading] = useState<AgentType | null>(null);
    const [copied, setCopied] = useState(false);
    const { getActiveTab } = useTabContext();

    const runAgent = async (agent: Agent) => {
        const tab = getActiveTab();
        if (!tab) {
            alert('Open a file first to use AI agents.');
            return;
        }

        setLoading(agent.id);
        setResult(null);

        try {
            const res = await fetch('http://localhost:4000/api/ai/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent: agent.id,
                    code: tab.content,
                    fileName: tab.fileName,
                    language: tab.language,
                    model: settings.aiModel,
                    geminiKey: settings.geminiKey,
                    openaiKey: settings.openaiKey
                }),
            });
            const data = await res.json();
            const content = data.result || data.error || 'No response';

            if (agent.id === 'health') {
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const healthData = JSON.parse(jsonMatch[0]);
                        setResult({ agent: agent.id, content, isHealth: true, healthData });
                        return;
                    }
                } catch (_) { }
            }

            setResult({ agent: agent.id, content });
        } catch (err: any) {
            setResult({ agent: agent.id, content: `Error: ${err.message}` });
        } finally {
            setLoading(null);
        }
    };

    const copyResult = () => {
        if (result?.content) {
            navigator.clipboard.writeText(result.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const HealthDisplay = ({ data }: { data: any }) => {
        const score = data.score ?? 0;
        const grade = data.grade ?? 'F';
        const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444';
        const circumference = 2 * Math.PI * 28;
        const offset = circumference - (score / 100) * circumference;

        return (
            <div className="space-y-4">
                {/* Score circle */}
                <div className="flex items-center gap-6 p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="relative w-20 h-20 shrink-0">
                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
                            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                            <circle cx="32" cy="32" r="28" fill="none" stroke={color} strokeWidth="6"
                                strokeDasharray={circumference} strokeDashoffset={offset}
                                style={{ transition: 'stroke-dashoffset 1s ease', strokeLinecap: 'round' }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-white">{score}</span>
                            <span className="text-[10px] text-gray-500">/ 100</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-4xl font-black" style={{ color }}>{grade}</div>
                        <div className="text-[12px] text-gray-400 mt-1">{data.summary}</div>
                    </div>
                </div>

                {/* Issues */}
                {data.issues?.length > 0 && (
                    <div>
                        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Issues</div>
                        <div className="space-y-1.5">
                            {data.issues.map((issue: any, i: number) => (
                                <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg text-[11px] border ${issue.severity === 'high' ? 'border-red-500/20 bg-red-500/5' : issue.severity === 'medium' ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-white/5 bg-white/5'}`}>
                                    <span className={`shrink-0 text-[9px] font-bold uppercase px-1 py-0.5 rounded ${issue.severity === 'high' ? 'bg-red-500/20 text-red-400' : issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-gray-400'}`}>{issue.severity}</span>
                                    <span className="text-gray-300">{issue.description}{issue.line ? ` (L${issue.line})` : ''}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Strengths */}
                {data.strengths?.length > 0 && (
                    <div>
                        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Strengths</div>
                        <div className="space-y-1">
                            {data.strengths.map((s: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-[11px] text-green-400">
                                    <Check size={11} /> {s}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                <Bot size={13} className="text-accent-purple" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AI Agents</span>
            </div>

            {/* Agent grid */}
            <div className="p-2 grid grid-cols-2 gap-1.5 border-b border-white/5">
                {AGENT_LIST.map(agent => (
                    <button
                        key={agent.id}
                        onClick={() => runAgent(agent)}
                        disabled={!!loading}
                        className="flex flex-col items-start gap-1 p-2.5 rounded-xl border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all disabled:opacity-50 text-left"
                    >
                        <div className={`${agent.color} flex items-center gap-1.5`}>
                            {loading === agent.id ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                    <RefreshCw size={13} />
                                </motion.div>
                            ) : agent.icon}
                            <span className="text-white text-[11px] font-medium">{agent.name}</span>
                        </div>
                        <span className="text-gray-600 text-[10px] leading-tight">{agent.description}</span>
                    </button>
                ))}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                <AnimatePresence mode="wait">
                    {loading && !result && (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex items-center gap-2 text-gray-500 text-[12px] py-4">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                <RefreshCw size={14} />
                            </motion.div>
                            Agent is analyzing your code...
                        </motion.div>
                    )}
                    {result && (
                        <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] text-gray-500 font-medium uppercase tracking-widest">
                                    {AGENT_LIST.find(a => a.id === result.agent)?.name} Result
                                </span>
                                <div className="flex gap-1">
                                    <button onClick={copyResult} className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors">
                                        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                                    </button>
                                    <button onClick={() => setResult(null)} className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors">
                                        <X size={12} />
                                    </button>
                                </div>
                            </div>
                            {result.isHealth && result.healthData ? (
                                <HealthDisplay data={result.healthData} />
                            ) : (
                                <div className="text-[12px] text-gray-300 leading-relaxed whitespace-pre-wrap font-mono bg-black/20 p-3 rounded-xl border border-white/5 overflow-x-auto">
                                    {result.content}
                                </div>
                            )}
                        </motion.div>
                    )}
                    {!loading && !result && (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center py-6 text-gray-600 text-[12px]">
                            <Bot size={24} className="mx-auto mb-2 opacity-30" />
                            <p>Select an agent to analyze your active file</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
