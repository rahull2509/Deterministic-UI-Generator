"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Loader2, ChevronDown, ChevronUp, Sparkles, Zap, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui-lib/Button"
import { Input } from "@/components/ui-lib/Input"
import type { UIAST } from "@/lib/schema/ui-ast"

interface ChatPanelProps {
    onCodeGenerated: (code: string) => void
    onASTUpdate?: (ast: UIAST) => void
    apiKey: string
    setApiKey: (key: string) => void
    currentCode: string
    currentAST?: UIAST | null
    collapsed?: boolean
    onToggleCollapse?: () => void
}

interface Message {
    role: "user" | "assistant"
    content: string
    type?: "text" | "plan" | "error" | "validation" | "step"
}

interface PipelineStep {
    step: string
    status: "start" | "complete" | "warning" | "error"
    data?: unknown
    model?: string
    latencyMs?: number
}

export default function ChatPanel({
    onCodeGenerated,
    onASTUpdate,
    apiKey,
    setApiKey,
    currentCode,
    currentAST,
    collapsed = false,
    onToggleCollapse,
}: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! I'm your UI Agent. Describe what you want to build — I'll plan, generate, and explain it step by step." }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([])
    const [showPipeline, setShowPipeline] = useState(true)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, pipelineSteps])

    const renderMarkdown = (text: string) => {
        let html = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        html = html.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, '<em>$1</em>')
        html = html.replace(/^- (.+)$/gm, '• $1')
        html = html.replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs font-mono">$1</code>')
        return <span dangerouslySetInnerHTML={{ __html: html }} />
    }

    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || loading) return

        const userMsg: Message = { role: "user", content: input }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setLoading(true)
        setPipelineSteps([])
        setShowPipeline(true)

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
                    apiKey,
                    currentCode,
                    currentAST,
                })
            })

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: "Unknown error" }))
                throw new Error(errData.error || `HTTP ${response.status}`)
            }

            // Stream processing
            const reader = response.body?.getReader()
            if (!reader) throw new Error("No response body")

            const decoder = new TextDecoder()
            let buffer = ""

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split("\n")
                buffer = lines.pop() || ""

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue
                    try {
                        const { event, data } = JSON.parse(line.slice(6))

                        if (event === "step") {
                            setPipelineSteps(prev => {
                                const existing = prev.findIndex(
                                    s => s.step === data.step && s.status === "start" && data.status !== "start"
                                )
                                if (existing >= 0) {
                                    const updated = [...prev]
                                    updated[existing] = data
                                    return updated
                                }
                                return [...prev, data]
                            })
                        } else if (event === "done") {
                            if (data.explanation) {
                                setMessages(prev => [...prev, {
                                    role: "assistant",
                                    content: data.explanation,
                                }])
                            }
                            if (data.validation && data.validation !== "✅ Code validation passed") {
                                setMessages(prev => [...prev, {
                                    role: "assistant",
                                    content: data.validation,
                                    type: "validation",
                                }])
                            }
                            if (data.code) {
                                onCodeGenerated(data.code)
                            }
                            if (data.ast && onASTUpdate) {
                                onASTUpdate(data.ast)
                            }
                        } else if (event === "error") {
                            setMessages(prev => [...prev, {
                                role: "assistant",
                                content: `Error: ${data.message}`,
                                type: "error",
                            }])
                        }
                    } catch {
                        // Skip malformed lines
                    }
                }
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error)
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `Error: ${msg}`,
                type: "error",
            }])
        } finally {
            setLoading(false)
        }
    }, [input, loading, messages, apiKey, currentCode, currentAST, onCodeGenerated, onASTUpdate])

    const stepIcons: Record<string, React.ReactNode> = {
        planner: <Sparkles className="h-3 w-3" />,
        generator: <Zap className="h-3 w-3" />,
        explainer: <Clock className="h-3 w-3" />,
    }

    const stepLabels: Record<string, string> = {
        planner: "Planning UI",
        generator: "Generating Code",
        explainer: "Explaining Design",
    }

    if (collapsed) {
        return (
            <div className="w-12 h-full bg-gray-900/5 dark:bg-gray-100/5 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 flex flex-col items-center py-4">
                <button
                    onClick={onToggleCollapse}
                    className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-400"
                >
                    <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-white/60 dark:bg-gray-950/60 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 w-96 max-w-md shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm flex justify-between items-center">
                <h2 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    Ryze Engine
                    <span className="text-[10px] bg-gradient-to-r from-blue-500 to-violet-500 text-white px-2 py-0.5 rounded-full font-medium">v2</span>
                </h2>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSettings(!showSettings)}
                        className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 h-auto py-1 px-2 text-xs"
                    >
                        {showSettings ? "Close" : "Settings"}
                    </Button>
                    {onToggleCollapse && (
                        <button
                            onClick={onToggleCollapse}
                            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                        >
                            <ChevronUp className="h-3.5 w-3.5 rotate-90" />
                        </button>
                    )}
                </div>
            </div>

            {/* Settings */}
            {showSettings && (
                <div className="p-4 bg-gray-50/80 dark:bg-gray-900/80 text-sm border-b border-gray-200/50 dark:border-gray-800/50">
                    <p className="mb-2 font-medium text-gray-700 dark:text-gray-300">API Key (Optional)</p>
                    <Input
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        type="password"
                        placeholder="Overrides .env keys"
                        className="bg-white dark:bg-gray-900"
                    />
                    <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                        Leave empty to use server environment variables. Supports OpenAI + Gemini.
                    </p>
                </div>
            )}

            {/* Pipeline Status */}
            {pipelineSteps.length > 0 && (
                <div className="border-b border-gray-200/50 dark:border-gray-800/50">
                    <button
                        onClick={() => setShowPipeline(!showPipeline)}
                        className="w-full px-4 py-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                        <span className="flex items-center gap-1.5">
                            <Zap className="h-3 w-3" />
                            Pipeline
                        </span>
                        <ChevronDown className={`h-3 w-3 transition-transform ${showPipeline ? "rotate-180" : ""}`} />
                    </button>
                    {showPipeline && (
                        <div className="px-4 pb-3 space-y-1.5">
                            {pipelineSteps.map((step, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                    <div className={`
                                        flex items-center justify-center h-5 w-5 rounded-full shrink-0
                                        ${step.status === "complete" ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" :
                                          step.status === "start" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" :
                                          step.status === "warning" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" :
                                          "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                        }
                                    `}>
                                        {step.status === "complete" ? <CheckCircle2 className="h-3 w-3" /> :
                                         step.status === "start" ? <Loader2 className="h-3 w-3 animate-spin" /> :
                                         step.status === "warning" ? <AlertCircle className="h-3 w-3" /> :
                                         stepIcons[step.step]}
                                    </div>
                                    <span className="text-gray-600 dark:text-gray-400 flex-1">
                                        {stepLabels[step.step] || step.step}
                                    </span>
                                    {step.model && (
                                        <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 font-mono">
                                            {step.model}
                                        </span>
                                    )}
                                    {step.latencyMs && (
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                                            {step.latencyMs}ms
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`p-3 rounded-xl text-sm transition-all ${
                            msg.role === "user"
                                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white ml-8 shadow-sm"
                                : msg.type === "error"
                                    ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 mr-8 border border-red-200 dark:border-red-800"
                                    : msg.type === "validation"
                                        ? "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300 mr-8 border border-yellow-200 dark:border-yellow-800"
                                        : "bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 mr-8 shadow-sm border border-gray-100 dark:border-gray-800"
                        }`}
                    >
                        <div className="whitespace-pre-wrap leading-relaxed">
                            {renderMarkdown(msg.content)}
                        </div>
                    </div>
                ))}
                {loading && pipelineSteps.length === 0 && (
                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-xs p-2">
                        <Loader2 className="h-3 w-3 animate-spin" /> Connecting to AI...
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-800/50">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe your UI..."
                        disabled={loading}
                        className="flex-1"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit()
                            }
                        }}
                    />
                    <Button
                        type="submit"
                        disabled={loading || !input.trim()}
                        size="icon"
                        variant="primary"
                        className="shrink-0"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
                <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                    {[
                        { label: "Login Form", prompt: "Login form with email and password" },
                        { label: "Dashboard", prompt: "Dashboard with sidebar, navbar, charts, and cards" },
                        { label: "Data Table", prompt: "Data table with search and sorting headers" },
                        { label: "Hero + Cards", prompt: "Hero section with heading and a grid of feature cards" },
                    ].map(({ label, prompt }) => (
                        <Button
                            key={label}
                            variant="ghost"
                            size="sm"
                            onClick={() => setInput(prompt)}
                            className="h-auto py-1 px-2.5 text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap border border-gray-200 dark:border-gray-800 rounded-full hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            {label}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    )
}
