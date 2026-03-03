import React, { useEffect, useRef } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { useSettings } from '../../context/SettingsContext';

interface MonacoEditorProps {
    language: string;
    value: string;
    onChange: (value: string | undefined) => void;
    theme?: string;
}

export function MonacoEditor({ language, value, onChange }: MonacoEditorProps) {
    const monaco = useMonaco();
    const { settings } = useSettings();
    const editorRef = useRef<any>(null);

    useEffect(() => {
        if (!monaco) return;

        // ── Define rich "Veronica Dark" syntax theme ─────────────────────────
        monaco.editor.defineTheme('veronica-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                // Comments
                { token: 'comment', foreground: '7c859d', fontStyle: 'italic' },
                { token: 'comment.line', foreground: '7c859d', fontStyle: 'italic' },
                { token: 'comment.block', foreground: '7c859d', fontStyle: 'italic' },

                // Keywords
                { token: 'keyword', foreground: 'c792ea', fontStyle: 'bold' },
                { token: 'keyword.control', foreground: 'c678dd', fontStyle: 'bold' },
                { token: 'keyword.operator', foreground: '89ddff' },
                { token: 'keyword.other', foreground: 'c678dd' },
                { token: 'keyword.declaration', foreground: 'c678dd', fontStyle: 'bold' },
                { token: 'keyword.type', foreground: 'c678dd' },

                // Strings
                { token: 'string', foreground: '98c379' },
                { token: 'string.escape', foreground: '56b6c2' },
                { token: 'string.template', foreground: '98c379' },
                { token: 'string.quoted', foreground: '98c379' },

                // Numbers & boolean
                { token: 'number', foreground: 'd19a66' },
                { token: 'number.float', foreground: 'd19a66' },
                { token: 'number.hex', foreground: 'd19a66' },
                { token: 'constant.numeric', foreground: 'd19a66' },
                { token: 'constant.language', foreground: '56b6c2' }, // true, false, null

                // Types & classes
                { token: 'type', foreground: 'e5c07b' },
                { token: 'type.identifier', foreground: 'e5c07b' },
                { token: 'entity.name.type', foreground: 'e5c07b' },
                { token: 'entity.name.class', foreground: 'e5c07b', fontStyle: 'bold' },
                { token: 'entity.name.function', foreground: '61afef' },
                { token: 'entity.other.inherited-class', foreground: 'e5c07b', fontStyle: 'italic' },

                // Functions
                { token: 'identifier', foreground: 'abb2bf' },
                { token: 'function', foreground: '61afef' },
                { token: 'support.function', foreground: '56b6c2' },
                { token: 'support.type', foreground: 'e5c07b' },
                { token: 'support.class', foreground: 'e5c07b' },
                { token: 'support.variable', foreground: 'e06c75' },
                { token: 'support.constant', foreground: 'd19a66' },

                // Variables & params
                { token: 'variable', foreground: 'e06c75' },
                { token: 'variable.parameter', foreground: 'e5c07b', fontStyle: 'italic' },
                { token: 'variable.other', foreground: 'abb2bf' },
                { token: 'variable.language', foreground: 'e06c75', fontStyle: 'italic' },

                // Operators & punctuation
                { token: 'delimiter', foreground: 'abb2bf' },
                { token: 'delimiter.bracket', foreground: 'abb2bf' },
                { token: 'delimiter.parenthesis', foreground: 'abb2bf' },
                { token: 'operator', foreground: '89ddff' },
                { token: 'punctuation', foreground: 'abb2bf' },

                // Markup / HTML / JSX
                { token: 'tag', foreground: 'e06c75' },
                { token: 'tag.attribute', foreground: 'd19a66' },
                { token: 'metatag', foreground: 'c678dd' },
                { token: 'attribute.name', foreground: 'd19a66' },
                { token: 'attribute.value', foreground: '98c379' },

                // CSS
                { token: 'attribute.value.number', foreground: 'd19a66' },
                { token: 'attribute.value.unit', foreground: '56b6c2' },
                { token: 'attribute.value.hex', foreground: 'd19a66' },

                // Python / Ruby specific
                { token: 'decorator', foreground: 'e5c07b', fontStyle: 'italic' },
                { token: 'invalid', foreground: 'ff5370', fontStyle: 'underline' },
            ],
            colors: {
                // Editor surface
                'editor.background': '#00000000', // transparent
                'editor.foreground': '#abb2bf',
                'editor.lineHighlightBackground': '#ffffff08',
                'editor.lineHighlightBorder': '#ffffff00',
                'editor.selectionBackground': '#7c3aed44',
                'editor.inactiveSelectionBackground': '#7c3aed22',
                'editor.wordHighlightBackground': '#56b6c222',
                'editor.wordHighlightStrongBackground': '#56b6c233',
                'editor.findMatchBackground': '#d19a6655',
                'editor.findMatchHighlightBackground': '#d19a6622',
                // Line numbers
                'editorLineNumber.foreground': '#4a5568',
                'editorLineNumber.activeForeground': '#7c859d',
                // Cursor
                'editorCursor.foreground': '#7c3aed',
                'editorCursor.background': '#ffffff',
                // Brackets
                'editorBracketMatch.background': '#7c3aed33',
                'editorBracketMatch.border': '#7c3aed99',
                // Indentation guides
                'editorIndentGuide.background': '#ffffff10',
                'editorIndentGuide.activeBackground': '#ffffff28',
                // Gutter / overview ruler
                'editorGutter.background': '#00000000',
                'editorOverviewRuler.border': '#ffffff08',
                // Scrollbar
                'scrollbarSlider.background': '#7c3aed30',
                'scrollbarSlider.hoverBackground': '#7c3aed50',
                'scrollbarSlider.activeBackground': '#7c3aed70',
                // Suggestion widget
                'editorSuggestWidget.background': '#131320',
                'editorSuggestWidget.border': '#7c3aed44',
                'editorSuggestWidget.selectedBackground': '#7c3aed44',
                'editorSuggestWidget.highlightForeground': '#7c3aed',
                // Hover widget
                'editorHoverWidget.background': '#131320',
                'editorHoverWidget.border': '#7c3aed44',
                // Minimap
                'minimap.background': '#0d0d18bb',
            },
        });

        monaco.editor.setTheme('veronica-dark');
    }, [monaco]);

    return (
        <div className="w-full h-full">
            <Editor
                height="100%"
                language={language}
                value={value}
                theme="veronica-dark"
                onChange={onChange}
                onMount={(editor) => { editorRef.current = editor; }}
                options={{
                    minimap: { enabled: true, scale: 0.75, renderCharacters: false },
                    fontSize: settings.fontSize,
                    fontFamily: `'${settings.fontFamily}', 'Fira Code', 'Cascadia Code', Consolas, monospace`,
                    tabSize: settings.tabSize,
                    wordWrap: settings.wordWrap ? 'on' : 'off',
                    fontLigatures: true,
                    formatOnPaste: true,
                    formatOnType: true,
                    padding: { top: 20, bottom: 24 },
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    contextmenu: true,
                    bracketPairColorization: { enabled: true },
                    guides: {
                        bracketPairs: true,
                        indentation: true,
                        highlightActiveBracketPair: true,
                    },
                    renderWhitespace: 'none',
                    renderLineHighlight: 'gutter',
                    scrollbar: {
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                        vertical: 'auto',
                        horizontal: 'auto',
                    },
                    codeLens: true,
                    autoIndent: 'full',
                    autoClosingBrackets: 'always',
                    autoClosingQuotes: 'always',
                    autoSurround: 'languageDefined',
                    snippetSuggestions: 'inline',
                    suggest: {
                        showMethods: true,
                        showFunctions: true,
                        showVariables: true,
                        showWords: true,
                        showValues: true,
                        showClasses: true,
                        showInterfaces: true,
                        showKeywords: true,
                        insertMode: 'replace',
                    },
                    hover: { enabled: true },
                    quickSuggestions: { other: true, comments: false, strings: false },
                    parameterHints: { enabled: true },
                    tabCompletion: 'on',
                    occurrencesHighlight: 'singleFile',
                    foldingStrategy: 'indentation',
                    showFoldingControls: 'mouseover',
                    links: true,
                    colorDecorators: true,
                }}
            />
        </div>
    );
}
