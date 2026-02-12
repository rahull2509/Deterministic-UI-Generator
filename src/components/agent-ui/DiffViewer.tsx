"use client"

import React from "react"

interface DiffViewerProps {
    oldCode: string
    newCode: string
}

export default function DiffViewer({ oldCode, newCode }: DiffViewerProps) {
    if (!oldCode && !newCode) {
        return (
            <div className="p-10 text-center text-gray-400">
                No code to compare
            </div>
        )
    }

    if (!oldCode) {
        return (
            <div className="p-4 bg-gray-50 h-full overflow-auto">
                <div className="mb-2 text-sm text-gray-500">New code (no previous version)</div>
                <pre className="text-xs bg-white p-4 rounded border">
                    <code>{newCode}</code>
                </pre>
            </div>
        )
    }

    // Simple line-by-line diff
    const oldLines = oldCode.split("\n")
    const newLines = newCode.split("\n")
    const maxLines = Math.max(oldLines.length, newLines.length)

    const diffLines: Array<{ type: "same" | "removed" | "added", old?: string, new?: string, lineNum: number }> = []

    // Very basic diff - just compare line by line
    // In production, use a proper diff algorithm like diff-match-patch
    for (let i = 0; i < maxLines; i++) {
        const oldLine = oldLines[i]
        const newLine = newLines[i]

        if (oldLine === newLine) {
            diffLines.push({ type: "same", old: oldLine, new: newLine, lineNum: i + 1 })
        } else if (oldLine && !newLine) {
            diffLines.push({ type: "removed", old: oldLine, lineNum: i + 1 })
        } else if (!oldLine && newLine) {
            diffLines.push({ type: "added", new: newLine, lineNum: i + 1 })
        } else if (oldLine !== newLine) {
            // Changed line - show as removed + added
            diffLines.push({ type: "removed", old: oldLine, lineNum: i + 1 })
            diffLines.push({ type: "added", new: newLine, lineNum: i + 1 })
        }
    }

    return (
        <div className="h-full overflow-auto bg-gray-50 p-4">
            <div className="mb-4 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                    <span className="text-gray-600">Removed</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                    <span className="text-gray-600">Added</span>
                </div>
            </div>
            <div className="bg-white border rounded shadow-sm font-mono text-xs">
                {diffLines.map((line, i) => (
                    <div
                        key={i}
                        className={`flex border-b last:border-b-0 ${line.type === "removed"
                                ? "bg-red-50 text-red-800"
                                : line.type === "added"
                                    ? "bg-green-50 text-green-800"
                                    : "bg-white text-gray-700"
                            }`}
                    >
                        <div className="w-12 flex-shrink-0 text-right pr-2 py-1 bg-gray-50 border-r text-gray-400 select-none">
                            {line.type !== "added" && line.lineNum}
                        </div>
                        <div className="flex-1 px-4 py-1 whitespace-pre overflow-x-auto">
                            {line.type === "removed" && (
                                <span>
                                    <span className="text-red-600 mr-2">-</span>
                                    {line.old}
                                </span>
                            )}
                            {line.type === "added" && (
                                <span>
                                    <span className="text-green-600 mr-2">+</span>
                                    {line.new}
                                </span>
                            )}
                            {line.type === "same" && line.old}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
