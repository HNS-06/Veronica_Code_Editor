export interface ProjectMeta {
    framework: string;
    architecture: string;
    language: string;
    dependencies: string[];
    devDependencies: string[];
    fileCount: number;
    totalSize: number;
    entryPoint: string;
    hasTests: boolean;
    hasTsConfig: boolean;
    detectedAt: number;
}

const FRAMEWORK_SIGNATURES: Record<string, string[]> = {
    'Next.js': ['next', 'next.config.js', 'next.config.ts'],
    'React': ['react-dom', 'react-scripts', '@vitejs/plugin-react'],
    'Vue': ['vue', '@vue/cli-service'],
    'Angular': ['@angular/core'],
    'Svelte': ['svelte', '@sveltejs/kit'],
    'Express': ['express'],
    'NestJS': ['@nestjs/core'],
    'Electron': ['electron'],
    'Vite': ['vite'],
};

const ARCH_SIGNATURES: Record<string, string[]> = {
    'Monorepo': ['lerna', 'turborepo', 'nx', 'workspaces'],
    'Component-based': ['react', 'vue', 'svelte'],
    'MVC': ['express', '@nestjs/core'],
    'Serverless': ['@vercel/node', 'netlify-lambda', '@aws-sdk'],
};

function detectFramework(deps: string[]): string {
    for (const [framework, signs] of Object.entries(FRAMEWORK_SIGNATURES)) {
        if (signs.some(s => deps.includes(s))) return framework;
    }
    return 'Unknown';
}

function detectArchitecture(deps: string[]): string {
    for (const [arch, signs] of Object.entries(ARCH_SIGNATURES)) {
        if (signs.some(s => deps.includes(s))) return arch;
    }
    return 'Standard';
}

export async function analyzeProject(): Promise<ProjectMeta | null> {
    // @ts-ignore
    if (!window.electronAPI?.readFile) return null;

    try {
        // @ts-ignore
        const pkgRaw = await window.electronAPI.readFile(
            // @ts-ignore
            window.__veronicaWorkspacePath ? `${window.__veronicaWorkspacePath}/package.json` : 'package.json'
        );
        const pkg = JSON.parse(pkgRaw);
        const allDeps = [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.devDependencies || {}),
        ];

        const meta: ProjectMeta = {
            framework: detectFramework(allDeps),
            architecture: detectArchitecture(allDeps),
            language: allDeps.includes('typescript') || Object.keys(pkg.devDependencies || {}).includes('typescript') ? 'TypeScript' : 'JavaScript',
            dependencies: Object.keys(pkg.dependencies || {}),
            devDependencies: Object.keys(pkg.devDependencies || {}),
            fileCount: 0,
            totalSize: 0,
            entryPoint: pkg.main || pkg.module || 'index.js',
            hasTests: allDeps.some(d => ['jest', 'vitest', 'mocha', 'jasmine'].includes(d)),
            hasTsConfig: allDeps.includes('typescript'),
            detectedAt: Date.now(),
        };

        localStorage.setItem('veronica_project_meta', JSON.stringify(meta));
        return meta;
    } catch {
        // Try to read from cache
        try {
            const cached = localStorage.getItem('veronica_project_meta');
            if (cached) return JSON.parse(cached);
        } catch { }
        return null;
    }
}

export function getCachedProjectMeta(): ProjectMeta | null {
    try {
        const cached = localStorage.getItem('veronica_project_meta');
        if (cached) return JSON.parse(cached);
    } catch { }
    return null;
}
