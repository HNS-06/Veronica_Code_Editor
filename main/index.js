const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const { fork } = require('child_process');

const isDev = !app.isPackaged;

// ─── Backend Server Process ──────────────────────────────────────────────────
let backendProcess = null;

function startBackend() {
    const serverPath = isDev
        ? path.join(__dirname, '../backend/server.js')
        : path.join(process.resourcesPath, 'backend/server.js');

    backendProcess = fork(serverPath, [], {
        cwd: isDev ? path.join(__dirname, '../') : process.resourcesPath,
        env: { ...process.env, NODE_ENV: isDev ? 'development' : 'production' },
        stdio: 'inherit'
    });

    backendProcess.on('error', (err) => {
        console.error('Failed to start backend server:', err);
    });
}

function stopBackend() {
    if (backendProcess) {
        backendProcess.kill();
        backendProcess = null;
    }
}

// ─── PTY Session Map ────────────────────────────────────────────────────────
let pty;
try { pty = require('node-pty'); } catch (e) { pty = null; console.error('node-pty not available:', e.message); }

/** @type {Map<string, import('node-pty').IPty>} */
const ptySessions = new Map();
let mainWindow = null;

function getShell() {
    if (process.platform === 'win32') return 'powershell.exe';
    return process.env.SHELL || (process.platform === 'darwin' ? 'zsh' : 'bash');
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        frame: false,
        transparent: true,
        icon: path.join(__dirname, '../assets/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    if (isDev) {
        const tryLoad = () => {
            mainWindow.loadURL('http://localhost:5173').catch(() => setTimeout(tryLoad, 500));
        };
        tryLoad();
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Kill all PTY sessions when window closes
    mainWindow.on('closed', () => {
        for (const [, term] of ptySessions.entries()) {
            try { term.kill(); } catch (_) { }
        }
        ptySessions.clear();
        mainWindow = null;
    });

    ipcMain.on('window-controls', (event, action) => {
        if (!mainWindow) return;
        if (action === 'minimize') mainWindow.minimize();
        if (action === 'maximize') mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
        if (action === 'close') mainWindow.close();
    });
}

// Force kill backend on app quit
app.on('will-quit', stopBackend);

app.whenReady().then(() => {
    startBackend();
    // ─── Terminal IPC ──────────────────────────────────────────────────────────

    ipcMain.handle('terminal:create', (event, { id, cols, rows, cwd }) => {
        if (!pty) return { error: 'node-pty is not available. Run: npm install node-pty' };

        // Kill any existing session with this ID
        if (ptySessions.has(id)) {
            try { ptySessions.get(id).kill(); } catch (_) { }
            ptySessions.delete(id);
        }

        const shell = getShell();
        const startCwd = cwd || process.env.HOME || process.env.USERPROFILE || process.cwd();

        try {
            const term = pty.spawn(shell, [], {
                name: 'xterm-256color',
                cols: Math.max(2, cols || 80),
                rows: Math.max(2, rows || 24),
                cwd: startCwd,
                env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' },
                useConpty: false, // Fix for Windows stdin dropping keystrokes
            });

            term.onData((data) => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send(`terminal:data:${id}`, data);
                }
            });

            term.onExit(({ exitCode }) => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send(`terminal:exit:${id}`, exitCode);
                }
                ptySessions.delete(id);
            });

            ptySessions.set(id, term);
            return { success: true, pid: term.pid, shell };
        } catch (err) {
            console.error('[PTY] Spawn error:', err);
            return { error: err.message };
        }
    });

    ipcMain.on('terminal:write', (event, { id, data }) => {
        const term = ptySessions.get(id);
        if (term) { try { term.write(data); } catch (_) { } }
    });

    ipcMain.on('terminal:resize', (event, { id, cols, rows }) => {
        const term = ptySessions.get(id);
        if (term && cols > 1 && rows > 1) {
            try { term.resize(cols, rows); } catch (_) { }
        }
    });

    ipcMain.on('terminal:kill', (event, { id }) => {
        const term = ptySessions.get(id);
        if (term) { try { term.kill(); } catch (_) { } ptySessions.delete(id); }
    });

    // ─── Filesystem IPC ────────────────────────────────────────────────────────

    ipcMain.handle('dialog:openDirectory', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] });
        return canceled ? null : filePaths[0];
    });

    ipcMain.handle('dialog:showSaveDialog', async () => {
        const { canceled, filePath } = await dialog.showSaveDialog({ properties: ['showOverwriteConfirmation'] });
        return canceled ? null : filePath;
    });

    ipcMain.handle('fs:readDir', async (event, dirPath) => {
        try {
            const dirents = await fs.readdir(dirPath, { withFileTypes: true });
            return dirents.map(d => ({ name: d.name, type: d.isDirectory() ? 'folder' : 'file', path: path.join(dirPath, d.name) }));
        } catch { return []; }
    });

    ipcMain.handle('fs:readFile', async (event, filePath) => fs.readFile(filePath, 'utf-8'));

    ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
        await fs.writeFile(filePath, content, 'utf-8'); return true;
    });

    ipcMain.handle('fs:createFile', async (event, filePath) => {
        await fs.writeFile(filePath, '', 'utf-8'); return true;
    });

    ipcMain.handle('fs:createFolder', async (event, folderPath) => {
        await fs.mkdir(folderPath, { recursive: true }); return true;
    });

    ipcMain.handle('fs:deleteItem', async (event, itemPath) => {
        await fs.rm(itemPath, { recursive: true, force: true }); return true;
    });

    ipcMain.handle('fs:rename', async (event, oldPath, newPath) => {
        await fs.rename(oldPath, newPath); return true;
    });

    // ─── Run File IPC ──────────────────────────────────────────────────────────
    const { spawn: spawnChild } = require('child_process');

    const runnersByExt = {
        '.py': { cmd: 'python', fallback: 'python3' },
        '.js': { cmd: 'node' },
        '.ts': { cmd: 'npx', args: ['ts-node'] },
        '.jsx': { cmd: 'node' },
        '.tsx': { cmd: 'npx', args: ['ts-node'] },
        '.rb': { cmd: 'ruby' },
        '.go': { cmd: 'go', args: ['run'] },
        '.rs': { cmd: 'cargo', args: ['run', '--manifest-path'] },
        '.sh': { cmd: 'bash' },
        '.php': { cmd: 'php' },
        '.java': { cmd: 'java' },
        '.cpp': { cmd: 'g++', extra: '-o /tmp/out && /tmp/out' },
        '.c': { cmd: 'gcc', extra: '-o /tmp/out && /tmp/out' },
    };

    ipcMain.on('run:file', (event, { filePath }) => {
        if (!filePath || !mainWindow) return;
        const ext = require('path').extname(filePath).toLowerCase();
        const runner = runnersByExt[ext];

        if (!runner) {
            mainWindow.webContents.send('run:output', `\r\n\x1b[33m⚠ No runner configured for ${ext} files.\x1b[0m\r\n`);
            mainWindow.webContents.send('run:done', 1);
            return;
        }

        const cwd = require('path').dirname(filePath);
        const args = [...(runner.args || []), filePath];
        mainWindow.webContents.send('run:output', `\x1b[36m▶ Running: ${runner.cmd} ${args.join(' ')}\x1b[0m\r\n\r\n`);

        const proc = spawnChild(runner.cmd, args, {
            cwd,
            env: { ...process.env },
            shell: process.platform === 'win32',
        });

        const send = (data) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('run:output', data.toString());
            }
        };
        proc.stdout.on('data', send);
        proc.stderr.on('data', (d) => {
            if (mainWindow && !mainWindow.isDestroyed())
                mainWindow.webContents.send('run:output', `\x1b[31m${d.toString()}\x1b[0m`);
        });
        proc.on('close', (code) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                const color = code === 0 ? '\x1b[32m' : '\x1b[31m';
                mainWindow.webContents.send('run:output', `\r\n${color}✓ Exited with code ${code}\x1b[0m\r\n`);
                mainWindow.webContents.send('run:done', code);
            }
        });
        proc.on('error', (err) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('run:output', `\r\n\x1b[31m✗ Error: ${err.message}\x1b[0m\r\n`);
                mainWindow.webContents.send('run:done', 1);
            }
        });
    });

    createWindow();
});

app.on('window-all-closed', () => {
    for (const [, term] of ptySessions.entries()) {
        try { term.kill(); } catch (_) { }
    }
    ptySessions.clear();
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
