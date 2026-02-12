"use client"

import Editor, { useMonaco } from "@monaco-editor/react"
import { useEffect } from "react"

interface CodeEditorProps {
    code: string
    onChange: (value: string | undefined) => void
}

export default function CodeEditor({ code, onChange }: CodeEditorProps) {
    const monaco = useMonaco()

    useEffect(() => {
        if (monaco) {
            // Configure typescript defaults if needed
            // Cast to any to avoid strict type checks for now as monaco types can be tricky
            const languages = monaco.languages.typescript as any;
            if (languages && languages.typescriptDefaults) {
                languages.typescriptDefaults.setCompilerOptions({
                    jsx: languages.JsxEmit.React,
                    target: languages.ScriptTarget.ESNext,
                    allowNonTsExtensions: true,
                })
            }
        }
    }, [monaco])

    return (
        <Editor
            height="100%"
            defaultLanguage="typescript"
            language="typescript"
            value={code}
            onChange={onChange}
            theme="vs-dark"
            options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
            }}
        />
    )
}
