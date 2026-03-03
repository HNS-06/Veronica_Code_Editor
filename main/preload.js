const { contextBridge, ipcRenderer } = require('electron');

// ─── Filesystem / Window API ────────────────────────────────────────────────
contextBridge.exposeInMainWorld('electronAPI', {
    windowControl: (action) => ipcRenderer.send('window-controls', action),
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    showSaveDialog: () => ipcRenderer.invoke('dialog:showSaveDialog'),
    readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),
    readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    createFile: (filePath) => ipcRenderer.invoke('fs:createFile', filePath),
    createFolder: (folderPath) => ipcRenderer.invoke('fs:createFolder', folderPath),
    deleteItem: (itemPath) => ipcRenderer.invoke('fs:deleteItem', itemPath),
    rename: (oldPath, newPath) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
    // ── Run File ──────────────────────────────────────────────────────────────
    runFile: (filePath) => ipcRenderer.send('run:file', { filePath }),
    onRunOutput: (cb) => {
        ipcRenderer.on('run:output', (_, data) => cb(data));
        return () => ipcRenderer.removeAllListeners('run:output');
    },
    onRunDone: (cb) => {
        ipcRenderer.once('run:done', (_, code) => cb(code));
        return () => ipcRenderer.removeAllListeners('run:done');
    },
});

// ─── Terminal IPC API ───────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('terminalAPI', {
    /** Spawn a new PTY session. Returns { success, pid, shell } or { error } */
    create: (id, cols, rows, cwd) =>
        ipcRenderer.invoke('terminal:create', { id, cols, rows, cwd }),

    /** Write data (user keystrokes) to the PTY stdin */
    write: (id, data) => ipcRenderer.send('terminal:write', { id, data }),

    /** Notify PTY of a terminal resize */
    resize: (id, cols, rows) => ipcRenderer.send('terminal:resize', { id, cols, rows }),

    /** Kill the PTY process */
    kill: (id) => ipcRenderer.send('terminal:kill', { id }),

    /** Listen for terminal output. Returns the channel name. */
    onData: (id, callback) => {
        const channel = `terminal:data:${id}`;
        const listener = (_, data) => callback(data);
        ipcRenderer.on(channel, listener);
        // Return cleanup fn
        return () => ipcRenderer.removeListener(channel, listener);
    },

    /** Listen for terminal exit (fires once) */
    onExit: (id, callback) => {
        const channel = `terminal:exit:${id}`;
        const listener = (_, code) => callback(code);
        ipcRenderer.once(channel, listener);
        return () => ipcRenderer.removeListener(channel, listener);
    },

    /** Remove all listeners for a terminal session (call on cleanup) */
    removeListeners: (id) => {
        ipcRenderer.removeAllListeners(`terminal:data:${id}`);
        ipcRenderer.removeAllListeners(`terminal:exit:${id}`);
    },
});
