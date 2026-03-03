import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ProjectMeta, analyzeProject, getCachedProjectMeta } from '../services/ProjectIntelligence';
import { useFileContext } from './FileContext';

interface ProjectIntelligenceContextType {
    projectMeta: ProjectMeta | null;
    isAnalyzing: boolean;
    refresh: () => Promise<void>;
}

const ProjectIntelligenceContext = createContext<ProjectIntelligenceContextType>({
    projectMeta: null,
    isAnalyzing: false,
    refresh: async () => { },
});

export function ProjectIntelligenceProvider({ children }: { children: React.ReactNode }) {
    const [projectMeta, setProjectMeta] = useState<ProjectMeta | null>(getCachedProjectMeta);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const { openedDirPath } = useFileContext();

    const refresh = useCallback(async () => {
        setIsAnalyzing(true);
        try {
            // Expose path for the service to read from
            if (openedDirPath) {
                // @ts-ignore
                window.__veronicaWorkspacePath = openedDirPath;
            }
            const meta = await analyzeProject();
            if (meta) setProjectMeta(meta);
        } finally {
            setIsAnalyzing(false);
        }
    }, [openedDirPath]);

    // Auto-analyze when workspace opens
    useEffect(() => {
        if (openedDirPath) refresh();
    }, [openedDirPath]);

    return (
        <ProjectIntelligenceContext.Provider value={{ projectMeta, isAnalyzing, refresh }}>
            {children}
        </ProjectIntelligenceContext.Provider>
    );
}

export const useProjectIntelligence = () => useContext(ProjectIntelligenceContext);
