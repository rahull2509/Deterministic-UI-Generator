"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import type { Variant, Elevation, Animation } from "@/lib/design-tokens"
import { getElevationClass } from "@/lib/design-tokens"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
    variant?: Variant
    elevation?: Elevation
    animation?: Animation
}

export const Modal = ({ isOpen, onClose, children, title, variant = "primary", elevation = 2, animation = "fade" }: ModalProps) => {
    const [visible, setVisible] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        if (isOpen) {
            setMounted(true)
            // Trigger animation on next frame
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setVisible(true))
            })
        } else {
            setVisible(false)
            const timer = setTimeout(() => setMounted(false), 200)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    if (!mounted) return null

    const animationClasses = {
        none: "",
        fade: visible
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95",
        slide: visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4",
    }

    const overlayClasses = visible
        ? "opacity-100"
        : "opacity-0"

    const variantClasses = {
        primary: "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
        secondary: "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600",
        ghost: "bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50",
    }

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200",
                overlayClasses
            )}
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Content */}
            <div
                className={cn(
                    "relative w-full max-w-lg rounded-lg border p-6 transition-all duration-200",
                    variantClasses[variant],
                    animationClasses[animation],
                    getElevationClass(elevation),
                )}
            >
                <div className="flex items-center justify-between mb-4">
                    {title && <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{title}</h2>}
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="sr-only">Close</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}
