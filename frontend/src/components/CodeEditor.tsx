'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useTheme } from '@/contexts/ThemeContext'

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[#0A0A0A]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#00E5FF]/30 border-t-[#00E5FF] animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Loading editor...</p>
      </div>
    </div>
  ),
})

interface CodeEditorProps {
  language: string
  initialCode?: string
  readOnly?: boolean
  onChange?: (value: string | undefined) => void
  height?: string
  showLineNumbers?: boolean
  className?: string
}

const languageMap: Record<string, string> = {
  python: 'python',
  java: 'java',
  javascript: 'javascript',
  js: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
  cpp: 'cpp',
  c: 'c',
  csharp: 'csharp',
  cs: 'csharp',
  go: 'go',
  rust: 'rust',
  ruby: 'ruby',
  php: 'php',
  sql: 'sql',
}

export default function CodeEditor({
  language,
  initialCode = '',
  readOnly = false,
  onChange,
  height = '400px',
  showLineNumbers = true,
  className = '',
}: CodeEditorProps) {
  const { theme } = useTheme()
  const [code, setCode] = useState(initialCode)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setCode(initialCode)
  }, [initialCode])

  const handleChange = (value: string | undefined) => {
    setCode(value || '')
    onChange?.(value)
  }

  const monacoLanguage = languageMap[language.toLowerCase()] || 'plaintext'

  // EPAM-themed editor options
  const editorOptions = {
    readOnly,
    minimap: { enabled: false },
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    lineNumbers: showLineNumbers ? 'on' as const : 'off' as const,
    renderLineHighlight: 'line' as const,
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
    automaticLayout: true,
    tabSize: 4,
    insertSpaces: true,
    padding: { top: 16, bottom: 16 },
    bracketPairColorization: { enabled: true },
    suggestOnTriggerCharacters: false, // Disable autocomplete for interview mode
    quickSuggestions: false,
    parameterHints: { enabled: false },
    autoClosingBrackets: 'always' as const,
    autoClosingQuotes: 'always' as const,
    formatOnPaste: false,
    formatOnType: false,
    scrollbar: {
      vertical: 'auto' as const,
      horizontal: 'auto' as const,
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
    },
  }

  if (!mounted) {
    return (
      <div 
        className={`overflow-hidden border border-[#2A2A2A] ${className}`}
        style={{ height }}
      >
        <div className="h-full flex items-center justify-center bg-[#0A0A0A]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#00E5FF]/30 border-t-[#00E5FF] animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">Loading editor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`overflow-hidden border border-[#2A2A2A] ${className}`}>
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0A0A0A] border-b border-[#2A2A2A]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]"></span>
          </div>
          <span className="text-xs font-mono text-gray-500 uppercase tracking-wide">
            {monacoLanguage}
          </span>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCode('')
                onChange?.('')
              }}
              className="px-2 py-1 text-xs text-gray-500 hover:text-[#00E5FF] transition-colors duration-200"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                setCode(initialCode)
                onChange?.(initialCode)
              }}
              className="px-2 py-1 text-xs text-gray-500 hover:text-[#00E5FF] transition-colors duration-200"
            >
              Reset
            </button>
          </div>
        )}
      </div>
      
      {/* Monaco Editor */}
      <MonacoEditor
        height={height}
        language={monacoLanguage}
        value={code}
        onChange={handleChange}
        theme="epam-dark"
        options={editorOptions}
        beforeMount={(monaco) => {
          // Define custom EPAM dark theme with cyan accents
          monaco.editor.defineTheme('epam-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
              { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
              { token: 'keyword', foreground: '00E5FF', fontStyle: 'bold' },
              { token: 'string', foreground: '10B981' },
              { token: 'number', foreground: 'F59E0B' },
              { token: 'type', foreground: 'A78BFA' },
              { token: 'function', foreground: '66F2FF' },
              { token: 'variable', foreground: 'FFFFFF' },
              { token: 'operator', foreground: '00E5FF' },
            ],
            colors: {
              'editor.background': '#000000',
              'editor.foreground': '#FFFFFF',
              'editor.lineHighlightBackground': '#0A0A0A',
              'editor.lineHighlightBorder': '#1A1A1A',
              'editorLineNumber.foreground': '#4A4A4A',
              'editorLineNumber.activeForeground': '#00E5FF',
              'editor.selectionBackground': '#00E5FF30',
              'editor.inactiveSelectionBackground': '#1A1A1A',
              'editorCursor.foreground': '#00E5FF',
              'editor.wordHighlightBackground': '#00E5FF20',
              'editorBracketMatch.background': '#00E5FF30',
              'editorBracketMatch.border': '#00E5FF',
              'editorIndentGuide.background': '#1A1A1A',
              'editorIndentGuide.activeBackground': '#2A2A2A',
              'scrollbarSlider.background': '#2A2A2A80',
              'scrollbarSlider.hoverBackground': '#3A3A3A80',
              'scrollbarSlider.activeBackground': '#00E5FF50',
            },
          })
          
          // Light theme for completeness
          monaco.editor.defineTheme('epam-light', {
            base: 'vs',
            inherit: true,
            rules: [
              { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
              { token: 'keyword', foreground: '0891B2', fontStyle: 'bold' },
              { token: 'string', foreground: '059669' },
              { token: 'number', foreground: 'D97706' },
              { token: 'type', foreground: '7C3AED' },
              { token: 'function', foreground: '0E7490' },
              { token: 'variable', foreground: '1F2937' },
              { token: 'operator', foreground: '0891B2' },
            ],
            colors: {
              'editor.background': '#FFFFFF',
              'editor.foreground': '#1F2937',
              'editor.lineHighlightBackground': '#F9FAFB',
              'editorLineNumber.foreground': '#9CA3AF',
              'editorLineNumber.activeForeground': '#0891B2',
              'editor.selectionBackground': '#0891B230',
              'editor.inactiveSelectionBackground': '#F3F4F6',
              'editorCursor.foreground': '#0891B2',
            },
          })
        }}
        onMount={(editor, monaco) => {
          // Set custom theme after mount
          monaco.editor.setTheme(theme === 'dark' ? 'epam-dark' : 'epam-light')
          
          // Focus the editor
          editor.focus()
        }}
      />
    </div>
  )
}
