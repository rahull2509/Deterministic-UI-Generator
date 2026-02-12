"use client"

import { useState, useCallback, useEffect } from "react"
import ChatPanel from "@/components/agent-ui/ChatPanel"
import LivePreview from "@/components/agent-ui/LivePreview"
import DiffViewer from "@/components/agent-ui/DiffViewer"
import dynamic from "next/dynamic"
import type { UIAST } from "@/lib/schema/ui-ast"

const Editor = dynamic(() => import("@/components/agent-ui/CodeEditor"), { ssr: false })

interface VersionEntry {
  code: string
  timestamp: number
  label?: string
}

export default function Home() {
  const [code, setCode] = useState("")
  const [history, setHistory] = useState<VersionEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "diff">("preview")
  const [apiKey, setApiKey] = useState("")
  const [currentAST, setCurrentAST] = useState<UIAST | null>(null)
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const [dark, setDark] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)

  // Theme toggle
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [dark])

  // Load theme preference on mount — default to LIGHT mode
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      setDark(true)
    } else {
      // Default to light mode (no system preference fallback)
      setDark(false)
    }
  }, [])

  // Save theme preference
  useEffect(() => {
    localStorage.setItem("theme", dark ? "dark" : "light")
  }, [dark])

  const handleCodeUpdate = useCallback((newCode: string) => {
    if (newCode === code) return
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ code: newCode, timestamp: Date.now(), label: `v${newHistory.length + 1}` })
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setCode(newCode)
    setActiveTab("preview")
  }, [code, history, historyIndex])

  const handleASTUpdate = useCallback((ast: UIAST) => {
    setCurrentAST(ast)
  }, [])

  const handleUndo = () => {
    if (historyIndex > 0) {
      const i = historyIndex - 1
      setHistoryIndex(i)
      setCode(history[i].code)
    } else if (historyIndex === 0) {
      setHistoryIndex(-1)
      setCode("")
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const i = historyIndex + 1
      setHistoryIndex(i)
      setCode(history[i].code)
    }
  }

  const jumpToVersion = (idx: number) => {
    setHistoryIndex(idx)
    setCode(history[idx].code)
  }

  const tabCls = (tab: string) =>
    `px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer select-none ${activeTab === tab
      ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
    }`

  return (
    <main className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Chat Panel */}
      <ChatPanel
        onCodeGenerated={handleCodeUpdate}
        onASTUpdate={handleASTUpdate}
        apiKey={apiKey}
        setApiKey={setApiKey}
        currentCode={code}
        currentAST={currentAST}
        collapsed={chatCollapsed}
        onToggleCollapse={() => setChatCollapsed(c => !c)}
      />

      {/* Workspace Panel */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Toolbar */}
        <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg">
              <button onClick={() => setActiveTab("preview")} className={tabCls("preview")}>Preview</button>
              <button onClick={() => setActiveTab("code")} className={tabCls("code")}>Code</button>
              <button
                onClick={() => setActiveTab("diff")}
                className={`${tabCls("diff")} ${historyIndex < 1 ? "opacity-40 cursor-not-allowed" : ""}`}
                disabled={historyIndex < 1}
              >
                Diff
              </button>
            </div>

            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Undo/Redo */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg">
              <button
                onClick={handleUndo}
                disabled={historyIndex < 0}
                className="px-2.5 py-1.5 text-xs rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" /></svg>
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="px-2.5 py-1.5 text-xs rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 14 20 9 15 4" /><path d="M4 20v-7a4 4 0 0 1 4-4h12" /></svg>
              </button>
            </div>

            {/* Version count badge */}
            {history.length > 0 && (
              <>
                <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
                <button
                  onClick={() => setShowTimeline(t => !t)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  {history.length} version{history.length !== 1 ? "s" : ""}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => setDark(d => !d)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
              )}
            </button>
            <span className="text-[10px] font-medium tracking-wide text-gray-400 dark:text-gray-500 uppercase">
              Ryze AI
            </span>
          </div>
        </div>

        {/* Version Timeline */}
        {showTimeline && history.length > 0 && (
          <div className="border-b border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm px-4 py-2 flex items-center gap-1 overflow-x-auto shrink-0">
            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mr-2 uppercase tracking-wide shrink-0">History</span>
            {history.map((entry, idx) => (
              <button
                key={idx}
                onClick={() => jumpToVersion(idx)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${idx === historyIndex
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                title={new Date(entry.timestamp).toLocaleTimeString()}
              >
                {entry.label}
              </button>
            ))}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-gray-50/50 dark:bg-gray-950/50">
          {activeTab === "preview" ? (
            <div className="absolute inset-0 p-4">
              <div className="h-full w-full bg-white dark:bg-gray-950 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <LivePreview code={code} />
              </div>
            </div>
          ) : activeTab === "diff" ? (
            <div className="absolute inset-0">
              <DiffViewer
                oldCode={historyIndex > 0 ? history[historyIndex - 1].code : ""}
                newCode={code}
              />
            </div>
          ) : (
            <div className="absolute inset-0">
              <Editor code={code} onChange={(val) => setCode(val || "")} />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
