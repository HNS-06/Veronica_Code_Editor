import React, { createContext, useContext, useState, useEffect } from 'react';

export interface FileContextType {
    activeFilePath: string | null;
    fileName: string | null;
    fileContent: string;
    setFileContent: (content: string) => void;
    isDirty: boolean;
    openFile: (path: string, name: string) => Promise<void>;
    saveFile: () => Promise<void>;
    openedDirPath: string | null;
    setOpenedDirPath: (path: string | null) => void;
}

const FileContext = createContext<FileContextType | null>(null);

export function FileProvider({ children }: { children: React.ReactNode }) {
    const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string>('// Veronica AI Editor\n\nfunction initialize() {\n  console.log("Ready to build the future.");\n}\n\ninitialize();');
    const [originalContent, setOriginalContent] = useState<string>('');
    const [openedDirPath, setOpenedDirPathState] = useState<string | null>(() => {
        return localStorage.getItem('veronica_last_workspace') || null;
    });

    const setOpenedDirPath = (path: string | null) => {
        setOpenedDirPathState(path);
        if (path) localStorage.setItem('veronica_last_workspace', path);
        else localStorage.removeItem('veronica_last_workspace');
    };

    const isDirty = activeFilePath !== null && fileContent !== originalContent;

    const openFile = async (path: string, name: string) => {
        try {
            // @ts-ignore
            const content = await window.electronAPI.readFile(path);
            setActiveFilePath(path);
            setFileName(name);
            setFileContent(content);
            setOriginalContent(content);
        } catch (err) {
            console.error("Failed to open file", err);
        }
    };

    const saveFile = async () => {
        if (!activeFilePath) return;
        try {
            // @ts-ignore
            await window.electronAPI.writeFile(activeFilePath, fileContent);
            setOriginalContent(fileContent);
        } catch (err) {
            console.error("Failed to save file", err);
        }
    };

    // Keyboard shortcut for saving
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveFile();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeFilePath, fileContent]);

    return (
        <FileContext.Provider value={{
            activeFilePath, fileName, fileContent, setFileContent, isDirty, openFile, saveFile, openedDirPath, setOpenedDirPath
        }}>
            {children}
        </FileContext.Provider>
    );
}

export const useFileContext = () => {
    const ctx = useContext(FileContext);
    if (!ctx) throw new Error('useFileContext must be used within a FileProvider');
    return ctx;
};
