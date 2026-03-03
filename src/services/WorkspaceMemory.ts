/**
 * AI Workspace Memory Service
 * Stores and retrieves project context for richer AI responses.
 */

interface MemoryEntry {
    id: string;
    type: 'file' | 'snippet' | 'decision' | 'note';
    content: string;
    fileName?: string;
    timestamp: number;
    tags: string[];
}

const STORAGE_KEY = 'veronica_workspace_memory';

export class WorkspaceMemory {
    private entries: MemoryEntry[] = [];

    constructor() {
        this.load();
    }

    private load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) this.entries = JSON.parse(raw);
        } catch { this.entries = []; }
    }

    private save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries.slice(-200)));
        } catch { }
    }

    add(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): string {
        const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const newEntry: MemoryEntry = { ...entry, id, timestamp: Date.now() };
        this.entries.push(newEntry);
        this.save();
        return id;
    }

    addFileContext(fileName: string, content: string) {
        // Remove old entry for same file
        this.entries = this.entries.filter(e => e.fileName !== fileName || e.type !== 'file');
        this.add({ type: 'file', content: content.slice(0, 2000), fileName, tags: [fileName.split('.').pop() || ''] });
    }

    addNote(note: string, tags: string[] = []) {
        this.add({ type: 'note', content: note, tags });
    }

    addDecision(decision: string, tags: string[] = []) {
        this.add({ type: 'decision', content: decision, tags });
    }

    search(query: string): MemoryEntry[] {
        const q = query.toLowerCase();
        return this.entries
            .filter(e => e.content.toLowerCase().includes(q) || e.fileName?.toLowerCase().includes(q) || e.tags.some(t => t.includes(q)))
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
    }

    getAll(): MemoryEntry[] {
        return [...this.entries].sort((a, b) => b.timestamp - a.timestamp);
    }

    remove(id: string) {
        this.entries = this.entries.filter(e => e.id !== id);
        this.save();
    }

    clear() {
        this.entries = [];
        localStorage.removeItem(STORAGE_KEY);
    }

    buildContextString(query?: string): string {
        const relevant = query ? this.search(query) : this.entries.slice(-10);
        if (relevant.length === 0) return '';
        return `\nWorkspace Memory (project context):\n${relevant.map(e => `[${e.type}${e.fileName ? ` - ${e.fileName}` : ''}]: ${e.content.slice(0, 300)}`).join('\n')}\n`;
    }

    get size() { return this.entries.length; }
}

export const workspaceMemory = new WorkspaceMemory();
