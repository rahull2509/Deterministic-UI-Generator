"use client"
import React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import type { Variant, Elevation, Animation } from "@/lib/design-tokens"
import { getElevationClass, getAnimationClass } from "@/lib/design-tokens"

const chartStyles = cva("rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-800 p-4 transition-all duration-300", {
    variants: {
        size: {
            sm: "h-48",
            md: "h-64",
            lg: "h-96",
        },
    },
    defaultVariants: {
        size: "md",
    },
})

const CHART_COLORS: Record<string, string[]> = {
    primary: ["#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a", "#60a5fa"],
    secondary: ["#6b7280", "#4b5563", "#374151", "#1f2937", "#111827", "#9ca3af"],
    ghost: ["#94a3b8", "#64748b", "#475569", "#334155", "#1e293b", "#cbd5e1"],
}

interface ChartProps extends VariantProps<typeof chartStyles> {
    title?: string
    data?: Array<{ label: string; value: number }>
    children?: React.ReactNode
    className?: string
    variant?: Variant
    elevation?: Elevation
    animation?: Animation
}

// Exported generic Chart (for backward compat)
export function Chart(props: ChartProps) {
    return <BarChart {...props} />
}

// Bar Chart Component
export function BarChart({ title, data, size, className, variant = "primary", elevation = 0, animation = "fade" }: ChartProps) {
    const [animatedHeights, setAnimatedHeights] = React.useState<number[]>([])
    const colors = CHART_COLORS[variant] || CHART_COLORS.primary

    const mockData = data || [
        { label: "Jan", value: 65 },
        { label: "Feb", value: 59 },
        { label: "Mar", value: 80 },
        { label: "Apr", value: 81 },
        { label: "May", value: 56 },
        { label: "Jun", value: 95 },
    ]

    const maxValue = Math.max(...mockData.map((d) => d.value))

    React.useEffect(() => {
        if (animation !== "none") {
            setAnimatedHeights(mockData.map(() => 0))
            const timer = setTimeout(() => {
                setAnimatedHeights(mockData.map((item) => (item.value / maxValue) * 100))
            }, 50)
            return () => clearTimeout(timer)
        } else {
            setAnimatedHeights(mockData.map((item) => (item.value / maxValue) * 100))
        }
    }, [data, animation, maxValue, mockData.length])

    return (
        <div className={cn(
            chartStyles({ size }),
            getElevationClass(elevation),
            getAnimationClass(animation),
            className
        )}>
            {title && <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">{title}</h3>}
            <div className="flex items-end justify-between h-full gap-2 pb-6">
                {mockData.map((item, i) => {
                    const height = animatedHeights[i] ?? 0
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex flex-col items-center justify-end flex-1">
                                <div
                                    className="w-full rounded-t transition-all duration-700 ease-out hover:opacity-80"
                                    style={{
                                        height: `${height}%`,
                                        backgroundColor: colors[i % colors.length],
                                    }}
                                    title={`${item.label}: ${item.value}`}
                                />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// Line Chart Component
export function LineChart({ title, data, size, className, variant = "primary", elevation = 0, animation = "fade" }: ChartProps) {
    const [pathOpacity, setPathOpacity] = React.useState(animation !== "none" ? 0 : 1)
    const colors = CHART_COLORS[variant] || CHART_COLORS.primary
    const strokeColor = colors[0]

    const mockData = data || [
        { label: "Jan", value: 65 },
        { label: "Feb", value: 59 },
        { label: "Mar", value: 80 },
        { label: "Apr", value: 81 },
        { label: "May", value: 56 },
        { label: "Jun", value: 95 },
    ]

    const maxValue = Math.max(...mockData.map((d) => d.value))
    const width = 100
    const height = 100
    const padding = 10

    React.useEffect(() => {
        if (animation !== "none") {
            const timer = setTimeout(() => setPathOpacity(1), 100)
            return () => clearTimeout(timer)
        }
    }, [animation])

    const points = mockData
        .map((item, i) => {
            const x = padding + (i / (mockData.length - 1)) * (width - 2 * padding)
            const y = height - padding - ((item.value / maxValue) * (height - 2 * padding))
            return `${x},${y}`
        })
        .join(" ")

    // Area fill path
    const firstX = padding
    const lastX = padding + ((mockData.length - 1) / (mockData.length - 1)) * (width - 2 * padding)
    const areaPath = `M ${firstX},${height - padding} L ${points.split(" ").map(p => p).join(" L ")} L ${lastX},${height - padding} Z`

    return (
        <div className={cn(
            chartStyles({ size }),
            getElevationClass(elevation),
            getAnimationClass(animation),
            className
        )}>
            {title && <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">{title}</h3>}
            <div className="flex flex-col h-full">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="flex-1 transition-opacity duration-700"
                    style={{ opacity: pathOpacity }}
                >
                    {/* Area fill */}
                    <path
                        d={areaPath}
                        fill={strokeColor}
                        opacity="0.1"
                    />
                    {/* Line */}
                    <polyline
                        points={points}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-sm"
                    />
                    {/* Points */}
                    {mockData.map((item, i) => {
                        const x = padding + (i / (mockData.length - 1)) * (width - 2 * padding)
                        const y = height - padding - ((item.value / maxValue) * (height - 2 * padding))
                        return (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="2.5"
                                fill={strokeColor}
                                stroke="white"
                                strokeWidth="1"
                                className="hover:r-4 transition-all cursor-pointer"
                            >
                                <title>{`${item.label}: ${item.value}`}</title>
                            </circle>
                        )
                    })}
                </svg>
                <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {mockData.map((item, i) => (
                        <span key={i}>{item.label}</span>
                    ))}
                </div>
            </div>
        </div>
    )
}

// Pie Chart Component
export function PieChart({ title, data, size, className, variant = "primary", elevation = 0, animation = "fade" }: ChartProps) {
    const [animatedAngles, setAnimatedAngles] = React.useState(animation !== "none" ? 0 : 360)
    const colors = CHART_COLORS[variant] || CHART_COLORS.primary

    const mockData = data || [
        { label: "Product A", value: 30 },
        { label: "Product B", value: 25 },
        { label: "Product C", value: 20 },
        { label: "Product D", value: 15 },
        { label: "Other", value: 10 },
    ]

    const total = mockData.reduce((sum, item) => sum + item.value, 0)

    React.useEffect(() => {
        if (animation !== "none") {
            const timer = setTimeout(() => setAnimatedAngles(360), 100)
            return () => clearTimeout(timer)
        }
    }, [animation])

    let currentAngle = -90

    return (
        <div className={cn(
            chartStyles({ size }),
            getElevationClass(elevation),
            getAnimationClass(animation),
            className
        )}>
            {title && <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">{title}</h3>}
            <div className="flex items-center justify-center gap-4 h-full">
                <svg
                    viewBox="0 0 100 100"
                    className="w-1/2 transition-transform duration-700"
                    style={{ transform: `rotate(${animatedAngles === 360 ? 0 : -90}deg)` }}
                >
                    {mockData.map((item, i) => {
                        const percentage = (item.value / total) * 100
                        const angle = (percentage / 100) * animatedAngles
                        const startAngle = currentAngle
                        const endAngle = currentAngle + angle
                        currentAngle = endAngle

                        const startRad = (startAngle * Math.PI) / 180
                        const endRad = (endAngle * Math.PI) / 180

                        const x1 = 50 + 40 * Math.cos(startRad)
                        const y1 = 50 + 40 * Math.sin(startRad)
                        const x2 = 50 + 40 * Math.cos(endRad)
                        const y2 = 50 + 40 * Math.sin(endRad)

                        const largeArc = angle > 180 ? 1 : 0

                        const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`

                        return (
                            <path
                                key={i}
                                d={path}
                                fill={colors[i % colors.length]}
                                className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                            >
                                <title>{`${item.label}: ${item.value} (${percentage.toFixed(1)}%)`}</title>
                            </path>
                        )
                    })}
                </svg>
                <div className="flex flex-col gap-1.5">
                    {mockData.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                            <div
                                className="w-3 h-3 rounded-sm shrink-0"
                                style={{ backgroundColor: colors[i % colors.length] }}
                            />
                            <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                            <span className="text-gray-400 dark:text-gray-500 ml-auto">{((item.value / total) * 100).toFixed(0)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
