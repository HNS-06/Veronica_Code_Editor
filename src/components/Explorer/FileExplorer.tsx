import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, FolderPlus, FilePlus, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { useFileContext } from '../../context/FileContext';
import { useTabContext } from '../../context/TabContext';

interface FileNode {
    name: string;
    type: 'file' | 'folder';
    path: string;
    children?: FileNode[];
    isOpen?: boolean;
}

type CreationState = { parentPath: string; type: 'file' | 'folder' } | null;

export function FileExplorer({ onOpenFile }: { onOpenFile?: (filePath: string, fileName: string) => void }) {
    const { openedDirPath, setOpenedDirPath } = useFileContext();
    const { createUntitledTab } = useTabContext();
    const [files, setFiles] = useState<FileNode[]>([]);
    const [creating, setCreating] = useState<CreationState>(null);
    const [newName, setNewName] = useState('');
    const [renaming, setRenaming] = useState<{ path: string; name: string } | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null);
    const newNameInputRef = useRef<HTMLInputElement>(null);

    const handleOpenWorkspace = async () => {
        try {
            // @ts-ignore
            const dirPath = await window.electronAPI.openDirectory();
            if (dirPath) setOpenedDirPath(dirPath);
        } catch (err) { console.error(err); }
    };

    const refresh = async () => {
        if (!openedDirPath) return;
        // @ts-ignore
        const dirents = await window.electronAPI.readDir(openedDirPath);
        setFiles(dirents);
    };

    useEffect(() => {
        if (!openedDirPath) return;
        refresh();
    }, [openedDirPath]);

    useEffect(() => {
        if (creating || renaming) setTimeout(() => newNameInputRef.current?.focus(), 50);
    }, [creating, renaming]);

    // Close context menu on outside click
    useEffect(() => {
        const handler = () => setContextMenu(null);
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    const toggleFolder = async (node: FileNode, indexList: number[]) => {
        const newFiles = JSON.parse(JSON.stringify(files));
        let level = newFiles;
        for (let i = 0; i < indexList.length - 1; i++) level = level[indexList[i]].children;
        const target = level[indexList[indexList.length - 1]];
        if (target.isOpen) {
            target.isOpen = false;
        } else {
            target.isOpen = true;
            if (!target.children) {
                // @ts-ignore
                target.children = await window.electronAPI.readDir(target.path);
            }
        }
        setFiles(newFiles);
    };

    const confirmCreate = async () => {
        if (!newName.trim() || !creating) return;
        const fullPath = `${creating.parentPath}\\${newName.trim()}`;
        try {
            if (creating.type === 'file') {
                // @ts-ignore
                await window.electronAPI.createFile(fullPath);
                if (onOpenFile) onOpenFile(fullPath, newName.trim());
            } else {
                // @ts-ignore
                await window.electronAPI.createFolder(fullPath);
            }
            await refresh();
        } catch (e) { console.error(e); }
        setCreating(null);
        setNewName('');
    };

    const confirmRename = async () => {
        if (!newName.trim() || !renaming) return;
        const dir = renaming.path.split('\\').slice(0, -1).join('\\');
        const newPath = `${dir}\\${newName.trim()}`;
        try {
            // @ts-ignore
            await window.electronAPI.rename(renaming.path, newPath);
            await refresh();
        } catch (e) { console.error(e); }
        setRenaming(null);
        setNewName('');
    };

    const handleDelete = async (node: FileNode) => {
        if (!confirm(`Delete "${node.name}"?`)) return;
        try {
            // @ts-ignore
            await window.electronAPI.deleteItem(node.path);
            await refresh();
        } catch (e) { console.error(e); }
        setContextMenu(null);
    };

    const NameInput = ({ onConfirm, onCancel, icon }: { onConfirm: () => void; onCancel: () => void; icon: React.ReactNode }) => (
        <div className="flex items-center gap-1.5 py-1 px-3 mx-1 bg-accent-blue/10 border border-accent-blue/30 rounded-lg">
            {icon}
            <input
                ref={newNameInputRef}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') onConfirm(); if (e.key === 'Escape') onCancel(); }}
                onBlur={onConfirm}
                className="flex-1 bg-transparent text-white text-[12px] outline-none placeholder-gray-500"
                placeholder="Name..."
            />
        </div>
    );

    const renderTree = (nodes: FileNode[], padding = 0, pathIndex: number[] = []): React.ReactNode => {
        return nodes.map((node, i) => {
            const currentPathIdx = [...pathIndex, i];
            const isActive = false; // tab-based highlighting handled in TabBar
            const isRenaming = renaming?.path === node.path;

            return (
                <div key={node.path}>
                    {isRenaming ? (
                        <div style={{ paddingLeft: `${padding + 8}px` }} className="py-0.5 pr-2">
                            <NameInput
                                onConfirm={confirmRename}
                                onCancel={() => { setRenaming(null); setNewName(''); }}
                                icon={node.type === 'folder' ? <Folder size={13} className="text-accent-blue shrink-0" /> : <File size={13} className="text-gray-400 shrink-0" />}
                            />
                        </div>
                    ) : (
                        <div
                            onClick={() => {
                                if (node.type === 'folder') toggleFolder(node, currentPathIdx);
                                else if (onOpenFile) onOpenFile(node.path, node.name);
                            }}
                            onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, node }); }}
                            className={`flex items-center gap-1.5 py-1.5 px-2 cursor-pointer rounded-lg text-[12px] transition-colors mx-1 group ${isActive ? 'bg-accent-blue/20 text-white' : 'hover:bg-white/10 text-gray-300'}`}
                            style={{ paddingLeft: `${padding + 8}px` }}
                        >
                            {node.type === 'folder'
                                ? (node.isOpen ? <ChevronDown size={13} className="text-gray-500 shrink-0" /> : <ChevronRight size={13} className="text-gray-500 shrink-0" />)
                                : <div className="w-[13px] shrink-0" />}
                            {node.type === 'folder'
                                ? <Folder size={13} className="text-accent-blue shrink-0" fill="rgba(59,130,246,0.2)" />
                                : <File size={13} className="text-gray-400 shrink-0" />}
                            <span className="truncate flex-1">{node.name}</span>
                            {/* Inline action buttons on hover */}
                            <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                                {node.type === 'folder' && (
                                    <>
                                        <button onClick={e => { e.stopPropagation(); setCreating({ parentPath: node.path, type: 'file' }); setNewName(''); }}
                                            className="p-0.5 hover:bg-white/20 rounded" title="New File">
                                            <FilePlus size={11} className="text-gray-400" />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); setCreating({ parentPath: node.path, type: 'folder' }); setNewName(''); }}
                                            className="p-0.5 hover:bg-white/20 rounded" title="New Folder">
                                            <FolderPlus size={11} className="text-gray-400" />
                                        </button>
                                    </>
                                )}
                                <button onClick={e => { e.stopPropagation(); setRenaming({ path: node.path, name: node.name }); setNewName(node.name); }}
                                    className="p-0.5 hover:bg-white/20 rounded" title="Rename">
                                    <Edit2 size={11} className="text-gray-400" />
                                </button>
                                <button onClick={e => { e.stopPropagation(); handleDelete(node); }}
                                    className="p-0.5 hover:bg-red-500/20 rounded" title="Delete">
                                    <Trash2 size={11} className="text-red-400" />
                                </button>
                            </div>
                        </div>
                    )}
                    {/* Inline creation inside folder */}
                    {node.type === 'folder' && node.isOpen && creating && creating.parentPath === node.path && (
                        <div style={{ paddingLeft: `${padding + 20}px` }} className="py-0.5 pr-2">
                            <NameInput
                                onConfirm={confirmCreate}
                                onCancel={() => { setCreating(null); setNewName(''); }}
                                icon={creating.type === 'folder'
                                    ? <Folder size={13} className="text-accent-blue shrink-0" />
                                    : <File size={13} className="text-gray-400 shrink-0" />}
                            />
                        </div>
                    )}
                    {node.type === 'folder' && node.isOpen && node.children && (
                        <div>{renderTree(node.children, padding + 12, currentPathIdx)}</div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="flex flex-col h-full w-full" onClick={() => setContextMenu(null)}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate max-w-[100px]" title={openedDirPath || 'Explorer'}>
                    {openedDirPath ? openedDirPath.split(/[\\/]/).pop() : 'Explorer'}
                </span>
                <div className="flex gap-0.5">
                    <button
                        onClick={() => {
                            if (openedDirPath) { setCreating({ parentPath: openedDirPath, type: 'file' }); setNewName(''); }
                            else { createUntitledTab(); }
                        }}
                        className={`p-1.5 rounded transition-colors ${openedDirPath ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-accent-blue hover:text-white hover:bg-white/10'}`}
                        title="New File"
                    >
                        <FilePlus size={15} />
                    </button>
                    <button
                        onClick={() => {
                            if (openedDirPath) { setCreating({ parentPath: openedDirPath, type: 'folder' }); setNewName(''); }
                            else { handleOpenWorkspace(); }
                        }}
                        className={`p-1.5 rounded transition-colors ${openedDirPath ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-white hover:bg-white/10'}`}
                        title={openedDirPath ? "New Folder" : "Open Folder First"}
                    >
                        <FolderPlus size={15} />
                    </button>
                    <button onClick={refresh} disabled={!openedDirPath}
                        className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors" title="Refresh">
                        <RefreshCw size={15} />
                    </button>
                    <button onClick={handleOpenWorkspace}
                        className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors" title="Open Folder">
                        <FolderOpen size={15} />
                    </button>
                </div>
            </div>

            {/* File tree */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
                {openedDirPath ? (
                    <>
                        {/* Root-level creation input */}
                        {creating && creating.parentPath === openedDirPath && (
                            <div className="py-0.5 px-2">
                                <NameInput
                                    onConfirm={confirmCreate}
                                    onCancel={() => { setCreating(null); setNewName(''); }}
                                    icon={creating.type === 'folder'
                                        ? <Folder size={13} className="text-accent-blue shrink-0" />
                                        : <File size={13} className="text-gray-400 shrink-0" />}
                                />
                            </div>
                        )}
                        {renderTree(files)}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4 text-gray-500">
                        <FolderOpen size={28} className="opacity-30" />
                        <p className="text-[12px]">No folder opened</p>
                        <button onClick={handleOpenWorkspace} className="px-4 py-2 bg-accent-blue/20 text-accent-blue rounded-lg text-[12px] hover:bg-accent-blue/30 transition-colors">
                            Open Folder
                        </button>
                    </div>
                )}
            </div>

            {/* Right-click context menu */}
            {contextMenu && (
                <div
                    className="fixed z-50 bg-panel/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 min-w-[160px] text-[12px]"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={e => e.stopPropagation()}
                >
                    {contextMenu.node.type === 'folder' && (
                        <>
                            <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-gray-300"
                                onClick={() => { setCreating({ parentPath: contextMenu.node.path, type: 'file' }); setNewName(''); setContextMenu(null); }}>
                                <FilePlus size={13} className="text-gray-400" /> New File
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-gray-300"
                                onClick={() => { setCreating({ parentPath: contextMenu.node.path, type: 'folder' }); setNewName(''); setContextMenu(null); }}>
                                <FolderPlus size={13} className="text-gray-400" /> New Folder
                            </button>
                            <div className="my-1 border-t border-white/5" />
                        </>
                    )}
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-gray-300"
                        onClick={() => { setRenaming({ path: contextMenu.node.path, name: contextMenu.node.name }); setNewName(contextMenu.node.name); setContextMenu(null); }}>
                        <Edit2 size={13} className="text-gray-400" /> Rename
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/10 text-red-400"
                        onClick={() => handleDelete(contextMenu.node)}>
                        <Trash2 size={13} /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}
