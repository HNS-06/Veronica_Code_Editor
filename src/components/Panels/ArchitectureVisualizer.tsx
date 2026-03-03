import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
    Node, Edge, Background, Controls, MiniMap,
    useNodesState, useEdgesState, addEdge,
    BackgroundVariant, MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useTabContext } from '../../context/TabContext';
import { Network, RefreshCw } from 'lucide-react';

interface FileNode {
    name: string;
    path: string;
    imports: string[];
    type: 'component' | 'hook' | 'context' | 'service' | 'util' | 'page' | 'other';
}

function detectNodeType(name: string, content: string): FileNode['type'] {
    if (name.startsWith('use')) return 'hook';
    if (name.includes('Context') || name.includes('Provider')) return 'context';
    if (name.includes('Service') || name.includes('Memory') || name.includes('service')) return 'service';
    if (name.includes('Page') || name.includes('View')) return 'page';
    if (content.includes('export function') && content.includes('return (') && content.includes('<')) return 'component';
    return 'other';
}

const NODE_COLORS: Record<FileNode['type'], string> = {
    component: '#3b82f6',
    hook: '#a855f7',
    context: '#f59e0b',
    service: '#22c55e',
    page: '#ec4899',
    util: '#6b7280',
    other: '#374151',
};

const nodeStyle = (type: FileNode['type']) => ({
    background: `${NODE_COLORS[type]}18`,
    border: `1px solid ${NODE_COLORS[type]}60`,
    borderRadius: '10px',
    padding: '8px 14px',
    color: '#e5e7eb',
    fontSize: '11px',
    fontFamily: 'Cascadia Code, monospace',
});

export function ArchitectureVisualizer() {
    const { tabs } = useTabContext();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const buildGraph = useCallback(async () => {
        if (tabs.length === 0) return;
        setIsAnalyzing(true);

        try {
            const fileNodes: FileNode[] = tabs.map(tab => {
                const name = tab.fileName.replace(/\.[^.]+$/, '');
                const imports = (tab.content.match(/import[^'"]*['"]([^'"]+)['"]/g) || [])
                    .map(imp => {
                        const match = imp.match(/['"]([^'"]+)['"]/);
                        return match ? match[1] : '';
                    })
                    .filter(imp => imp.startsWith('.') || imp.startsWith('~'))
                    .map(imp => imp.split('/').pop() || imp);

                return {
                    name, path: tab.filePath,
                    imports,
                    type: detectNodeType(name, tab.content),
                };
            });

            // Position nodes in a grid
            const COLS = 4;
            const newNodes: Node[] = fileNodes.map((fn, i) => ({
                id: fn.path,
                data: {
                    type: fn.type,
                    label: (
                        <div className="flex flex-col items-start gap-0.5">
                            <span style={{ color: NODE_COLORS[fn.type], fontSize: '10px', opacity: 0.7 }}>{fn.type}</span>
                            <span>{fn.name}</span>
                        </div>
                    )
                },
                position: { x: (i % COLS) * 220, y: Math.floor(i / COLS) * 120 },
                style: nodeStyle(fn.type),
            }));

            const newEdges: Edge[] = [];
            fileNodes.forEach(fn => {
                fn.imports.forEach(imp => {
                    const target = fileNodes.find(n => n.name === imp || n.name.toLowerCase() === imp.toLowerCase());
                    if (target && target.path !== fn.path) {
                        newEdges.push({
                            id: `${fn.path}->${target.path}`,
                            source: fn.path,
                            target: target.path,
                            animated: false,
                            style: { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1.5 },
                            markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255,255,255,0.2)' },
                        });
                    }
                });
            });

            setNodes(newNodes);
            setEdges(newEdges);
        } finally {
            setIsAnalyzing(false);
        }
    }, [tabs]);

    useEffect(() => { buildGraph(); }, [tabs.length]);

    const onConnect = useCallback((params: any) => setEdges(eds => addEdge(params, eds)), []);

    const LEGEND = Object.entries(NODE_COLORS).map(([type, color]) => ({ type, color }));

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Network size={13} className="text-accent-blue" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Architecture</span>
                </div>
                <button onClick={buildGraph} disabled={isAnalyzing}
                    className="p-1 text-gray-600 hover:text-white hover:bg-white/5 rounded transition-colors">
                    <RefreshCw size={13} className={isAnalyzing ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 px-4 py-2 border-b border-white/5">
                {LEGEND.map(({ type, color }) => (
                    <div key={type} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                        {type}
                    </div>
                ))}
            </div>

            <div className="flex-1 relative">
                {tabs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 text-[12px] gap-2">
                        <Network size={28} className="opacity-30" />
                        <p>Open files to visualize dependencies</p>
                    </div>
                ) : (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        fitView
                        proOptions={{ hideAttribution: true }}
                        style={{ background: 'transparent' }}
                    >
                        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.04)" />
                        <Controls style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                        <MiniMap
                            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}
                            nodeColor={n => NODE_COLORS[(n.data as { type?: FileNode['type'] })?.type || 'other']}
                        />
                    </ReactFlow>
                )}
            </div>
        </div>
    );
}
