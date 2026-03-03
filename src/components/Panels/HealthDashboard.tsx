import React, { useState } from 'react';
import { Zap, RefreshCw, AlertTriangle, CheckCircle2, FileCode } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTabContext } from '../../context/TabContext';
import { useSettings } from '../../context/SettingsContext';
import { useAITimeline } from '../../context/AITimelineContext';

interface HealthScore {
    maintainability: number;
    security: number;
    complexity: number;
    duplication: number;
    fileSize: number;
    overall: number;
    grade: string;
    summary: string;
    issues: { type: string; severity: string; description: string; line?: number }[];
}

function RadarChart({ scores }: { scores: Record<string, number> }) {
    const labels = Object.keys(scores);
    const values = Object.values(scores);
    const n = labels.length;
    const cx = 80, cy = 80, r = 60;

    const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
    const point = (i: number, val: number) => {
        const a = angle(i);
        const distance = (val / 100) * r;
        return { x: cx + distance * Math.cos(a), y: cy + distance * Math.sin(a) };
    };
    const labelPos = (i: number) => {
        const a = angle(i);
        return { x: cx + (r + 18) * Math.cos(a), y: cy + (r + 12) * Math.sin(a) };
    };

    const polygonPoints = values.map((v, i) => {
        const p = point(i, v);
        return `${p.x},${p.y}`;
    }).join(' ');

    const gridPoints = (scale: number) => values.map((_, i) => {
        const p = point(i, scale);
        return `${p.x},${p.y}`;
    }).join(' ');

    const color = (scores.overall ?? 70) >= 80 ? '#22c55e' : (scores.overall ?? 70) >= 60 ? '#eab308' : '#ef4444';

    return (
        <svg width="160" height="160" viewBox="0 0 160 160" className="mx-auto">
            {/* Grid rings */}
            {[25, 50, 75, 100].map(scale => (
                <polygon key={scale} points={gridPoints(scale)}
                    fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            ))}
            {/* Axis lines */}
            {labels.map((_, i) => {
                const p = point(i, 100);
                return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />;
            })}
            {/* Score polygon */}
            <motion.polygon
                points={polygonPoints}
                fill={`${color}22`}
                stroke={color}
                strokeWidth="2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                strokeLinejoin="round"
            />
            {/* Dots */}
            {values.map((v, i) => {
                const p = point(i, v);
                return <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />;
            })}
            {/* Labels */}
            {labels.map((label, i) => {
                const lp = labelPos(i);
                return (
                    <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
                        fontSize="8" fill="rgba(156,163,175,0.8)" fontFamily="monospace">
                        {label}
                    </text>
                );
            })}
        </svg>
    );
}

export function HealthDashboard() {
    const { getActiveTab } = useTabContext();
    const { settings } = useSettings();
    const { logAction } = useAITimeline();
    const [health, setHealth] = useState<HealthScore | null>(null);
    const [loading, setLoading] = useState(false);

    const runAnalysis = async () => {
        const tab = getActiveTab();
        if (!tab) { alert('Open a file first.'); return; }
        setLoading(true);

        const actionId = logAction({
            actionType: 'other',
            description: `Code health analysis on ${tab.fileName}`,
            filePath: tab.filePath,
        });

        try {
            const res = await fetch('http://localhost:4000/api/ai/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent: 'health',
                    code: tab.content,
                    fileName: tab.fileName,
                    language: tab.language,
                    model: settings.aiModel,
                    geminiKey: settings.geminiKey,
                    openaiKey: settings.openaiKey,
                }),
            });
            const data = await res.json();
            const text = data.result || '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const score: HealthScore = {
                    maintainability: Math.min(100, Math.max(0, parsed.score ?? 70)),
                    security: Math.min(100, Math.max(0, 100 - (parsed.issues?.filter((i: any) => i.type === 'security').length ?? 0) * 15)),
                    complexity: Math.min(100, Math.max(0, parsed.score ?? 70)),
                    duplication: Math.min(100, Math.max(0, 100 - (parsed.issues?.filter((i: any) => i.type === 'duplication').length ?? 0) * 20)),
                    fileSize: Math.min(100, Math.max(0, 100 - Math.floor(tab.content.length / 500))),
                    overall: parsed.score ?? 70,
                    grade: parsed.grade ?? 'C',
                    summary: parsed.summary ?? '',
                    issues: parsed.issues ?? [],
                };
                setHealth(score);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const gradeColor = health ? (health.overall >= 80 ? 'text-green-400' : health.overall >= 60 ? 'text-yellow-400' : 'text-red-400') : 'text-gray-500';

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Zap size={13} className="text-cyan-400" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Code Health</span>
                </div>
                <button
                    onClick={runAnalysis}
                    disabled={loading}
                    className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-cyan-400 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Analyzing...' : 'Analyze'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                {!health && !loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 text-[12px] text-center gap-3">
                        <Zap size={28} className="opacity-20" />
                        <p>Click Analyze to score your active file across 5 dimensions.</p>
                        <button onClick={runAnalysis}
                            className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl text-[11px] hover:bg-cyan-500/20 transition-colors">
                            Run Health Check
                        </button>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500 text-[12px]">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                            <RefreshCw size={20} />
                        </motion.div>
                        <p>Analyzing code quality...</p>
                    </div>
                ) : health && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        {/* Score overview */}
                        <div className="flex items-center justify-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="text-center">
                                <div className={`text-5xl font-black ${gradeColor}`}>{health.grade}</div>
                                <div className="text-[10px] text-gray-600 mt-1">{health.overall}/100</div>
                            </div>
                            <RadarChart scores={{
                                Maintain: health.maintainability,
                                Security: health.security,
                                Complexity: health.complexity,
                                Duplicate: health.duplication,
                                'File Size': health.fileSize,
                            }} />
                        </div>

                        {/* Summary */}
                        {health.summary && (
                            <p className="text-[11px] text-gray-400 leading-relaxed px-1">{health.summary}</p>
                        )}

                        {/* Score bars */}
                        <div className="space-y-2">
                            {[
                                { label: 'Maintainability', value: health.maintainability },
                                { label: 'Security', value: health.security },
                                { label: 'Complexity', value: health.complexity },
                                { label: 'Duplication', value: health.duplication },
                                { label: 'File Size', value: health.fileSize },
                            ].map(({ label, value }) => {
                                const color = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500';
                                return (
                                    <div key={label}>
                                        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                            <span>{label}</span>
                                            <span>{value}</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                className={`h-full ${color} rounded-full`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${value}%` }}
                                                transition={{ duration: 0.7, delay: 0.1 }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Issues */}
                        {health.issues.length > 0 && (
                            <div className="space-y-1.5">
                                <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2">Issues ({health.issues.length})</div>
                                {health.issues.map((issue, i) => (
                                    <div key={i} className={`flex items-start gap-2 p-2 rounded-lg text-[10px] border
                                        ${issue.severity === 'high' ? 'border-red-500/20 bg-red-500/5' :
                                            issue.severity === 'medium' ? 'border-yellow-500/20 bg-yellow-500/5' :
                                                'border-white/5 bg-white/3'}`}>
                                        <AlertTriangle size={10} className={
                                            issue.severity === 'high' ? 'text-red-400 shrink-0 mt-0.5' :
                                                issue.severity === 'medium' ? 'text-yellow-400 shrink-0 mt-0.5' : 'text-gray-500 shrink-0 mt-0.5'
                                        } />
                                        <span className="text-gray-300 leading-snug">{issue.description}{issue.line ? ` (L${issue.line})` : ''}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
