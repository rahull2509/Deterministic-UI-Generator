"use client"

import React, { useEffect, useState } from "react"
import { transform } from "sucrase"
import * as LucideIcons from "lucide-react"
import { analyzeCode, createBlockedScope, sanitizeGeneratedCode } from "@/lib/engine/sandbox"

// Import all UI components
import { Button } from "@/components/ui-lib/Button"
import { Input } from "@/components/ui-lib/Input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui-lib/Card"
import { Box, Stack, Grid, Container } from "@/components/ui-lib/Layouts"
import { Heading, Text } from "@/components/ui-lib/Typography"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter, TableCaption } from "@/components/ui-lib/Table"
import { Modal } from "@/components/ui-lib/Modal"
import { Navbar } from "@/components/ui-lib/Navbar"
import { Sidebar, SidebarItem } from "@/components/ui-lib/Sidebar"
import { Chart, BarChart, LineChart, PieChart } from "@/components/ui-lib/Chart"

// Controlled scope — ONLY registered components
const componentScope: Record<string, unknown> = {
    React,
    useState: React.useState,
    useEffect: React.useEffect,
    useCallback: React.useCallback,
    useMemo: React.useMemo,
    useRef: React.useRef,
    Button,
    Input,
    Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
    Box, Stack, Grid, Container,
    Heading, Text,
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter, TableCaption,
    Modal,
    Navbar,
    Sidebar, SidebarItem,
    Chart, BarChart, LineChart, PieChart,
}

export default function LivePreview({ code }: { code: string }) {
    const [Component, setComponent] = useState<React.ComponentType | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!code) return

        try {
            // Step 1: Sanitize generated code
            let processedCode = sanitizeGeneratedCode(code)

            // Step 2: Static security analysis
            const analysis = analyzeCode(processedCode)
            if (!analysis.safe) {
                setError(`Security: ${analysis.issues.join("; ")}`)
                return
            }

            // Step 3: Remove imports (handled via scope injection)
            const codeWithoutImports = processedCode.replace(
                /import\s+.*?from\s+['"].*?['"];?/g,
                ""
            )

            // Step 4: Transpile JSX → JS
            const transformed = transform(codeWithoutImports, {
                transforms: ["typescript", "jsx"],
                production: true,
            }).code

            // Step 5: Extract used icons from imports (selective, not global spread)
            const usedIcons: Record<string, unknown> = {}
            const iconImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g
            let match

            console.log('[LivePreview] Extracting icons from code...')
            while ((match = iconImportRegex.exec(code)) !== null) {
                const importStatement = match[1]
                console.log('[LivePreview] Found icon import:', importStatement)
                const imports = importStatement.split(",")
                imports.forEach(imp => {
                    const trimmed = imp.trim()
                    // Handle aliased imports: "BarChart as BarChartIcon"
                    if (trimmed.includes(" as ")) {
                        const parts = trimmed.split(/\s+as\s+/)
                        const originalName = parts[0]?.trim()
                        const aliasName = parts[1]?.trim()
                        if (originalName && aliasName && (LucideIcons as Record<string, unknown>)[originalName]) {
                            console.log(`[LivePreview] Aliased icon: ${originalName} -> ${aliasName}`)
                            usedIcons[aliasName] = (LucideIcons as Record<string, unknown>)[originalName]
                        } else {
                            console.warn(`[LivePreview] Failed to resolve aliased icon: ${trimmed}`)
                        }
                    } else {
                        // Handle regular imports
                        if (trimmed && (LucideIcons as Record<string, unknown>)[trimmed]) {
                            console.log(`[LivePreview] Regular icon: ${trimmed}`)
                            usedIcons[trimmed] = (LucideIcons as Record<string, unknown>)[trimmed]
                        } else if (trimmed) {
                            console.warn(`[LivePreview] Icon not found in lucide-react: ${trimmed}`)
                        }
                    }
                })
            }
            console.log('[LivePreview] Registered icons:', Object.keys(usedIcons))

            // Step 6: Build scope — icons first, then UI components override
            const blockedScope = createBlockedScope()
            
            // Create fallback for missing icons to provide better error messages
            const iconProxy = new Proxy(usedIcons, {
                get(target, prop) {
                    if (prop in target) {
                        return target[prop as string]
                    }
                    console.error(`[LivePreview] Icon "${String(prop)}" not found. Available icons:`, Object.keys(target))
                    // Return a placeholder component instead of undefined
                    return () => React.createElement('span', { 
                        style: { color: 'red', fontWeight: 'bold' } 
                    }, `[Icon: ${String(prop)} not found]`)
                }
            })
            
            const combinedScope = {
                ...blockedScope,
                ...iconProxy,
                ...componentScope,
            }

            console.log('[LivePreview] Final scope keys:', Object.keys(combinedScope).filter(k => !k.startsWith('_')).sort())

            // Step 7: Prepare executable code
            let runnableCode = transformed.replace(
                /export\s+default\s+function\s+([a-zA-Z0-9_]+)/,
                "return function $1"
            )
            if (runnableCode.includes("export default")) {
                runnableCode = runnableCode.replace(/export\s+default\s+/, "return ")
            }

            console.log('[LivePreview] Runnable code snippet:', runnableCode.substring(0, 500))

            // Step 8: Execute with timeout protection
            const keys = Object.keys(combinedScope)
            const values = Object.values(combinedScope)

            const compFn = new Function("__deadline__", ...keys, `
                ${runnableCode}
            `)

            const deadline = Date.now() + 5000 // 5 second timeout
            const GeneratedComponent = compFn(deadline, ...values)

            setComponent(() => GeneratedComponent)
            setError(null)
        } catch (err: unknown) {
            console.error("Preview Error:", err)
            const errorMsg = err instanceof Error ? err.message : JSON.stringify(err)
            setError(errorMsg || "Unknown error occurred")
        }
    }, [code])

    if (error) {
        return (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 m-4">
                <h3 className="font-bold text-sm">Rendering Error</h3>
                <pre className="text-xs mt-2 whitespace-pre-wrap font-mono">{error}</pre>
            </div>
        )
    }

    if (!Component) {
        return (
            <div className="p-10 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900 dark:to-violet-900 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="m9 8 6 4-6 4Z" />
                    </svg>
                </div>
                <p className="text-sm">Describe a UI to generate a preview</p>
            </div>
        )
    }

    return (
        <div className="w-full h-full overflow-auto p-4 bg-white dark:bg-gray-950">
            <ErrorBoundary>
                <Component />
            </ErrorBoundary>
        </div>
    )
}

class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                    <h3 className="font-bold text-sm">Runtime Error</h3>
                    <pre className="text-xs mt-2 whitespace-pre-wrap font-mono">
                        {this.state.error?.message}
                    </pre>
                </div>
            )
        }
        return this.props.children
    }
}
