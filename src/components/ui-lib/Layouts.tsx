import * as React from "react"
import { cn } from "@/lib/utils"
import type { Elevation, Animation } from "@/lib/design-tokens"
import { getElevationClass, getAnimationClass } from "@/lib/design-tokens"

interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
    padding?: "none" | "sm" | "md" | "lg"
    background?: "default" | "muted" | "brand"
    elevation?: Elevation
    animation?: Animation
}

export const Box = React.forwardRef<HTMLDivElement, BoxProps>(
    ({ className, padding = "md", background = "default", elevation = 0, animation = "none", ...props }, ref) => {
        const paddings = {
            none: "p-0",
            sm: "p-2",
            md: "p-4",
            lg: "p-8",
        }
        const backgrounds = {
            default: "bg-white dark:bg-gray-950",
            muted: "bg-gray-50 dark:bg-gray-900",
            brand: "bg-blue-50 dark:bg-blue-950",
        }
        return (
            <div
                ref={ref}
                className={cn(
                    paddings[padding],
                    backgrounds[background],
                    getElevationClass(elevation),
                    getAnimationClass(animation),
                    className
                )}
                {...props}
            />
        )
    }
)
Box.displayName = "Box"

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
    direction?: "row" | "column"
    gap?: "none" | "sm" | "md" | "lg"
    align?: "start" | "center" | "end" | "stretch"
    justify?: "start" | "center" | "end" | "between"
    elevation?: Elevation
    animation?: Animation
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
    ({ className, direction = "column", gap = "md", align = "stretch", justify = "start", elevation = 0, animation = "none", ...props }, ref) => {
        const gaps = {
            none: "gap-0",
            sm: "gap-2",
            md: "gap-4",
            lg: "gap-8",
        }
        const aligns = {
            start: "items-start",
            center: "items-center",
            end: "items-end",
            stretch: "items-stretch",
        }
        const justifies = {
            start: "justify-start",
            center: "justify-center",
            end: "justify-end",
            between: "justify-between",
        }
        return (
            <div
                ref={ref}
                className={cn(
                    "flex",
                    direction === "column" ? "flex-col" : "flex-row",
                    gaps[gap],
                    aligns[align],
                    justifies[justify],
                    getElevationClass(elevation),
                    getAnimationClass(animation),
                    className
                )}
                {...props}
            />
        )
    }
)
Stack.displayName = "Stack"

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
    columns?: 1 | 2 | 3 | 4
    gap?: "sm" | "md" | "lg"
    responsive?: boolean
    elevation?: Elevation
    animation?: Animation
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
    ({ className, columns = 1, gap = "md", responsive = true, elevation = 0, animation = "none", ...props }, ref) => {
        const responsiveCols = {
            1: "grid-cols-1",
            2: "grid-cols-1 sm:grid-cols-2",
            3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        }
        const fixedCols = {
            1: "grid-cols-1",
            2: "grid-cols-2",
            3: "grid-cols-3",
            4: "grid-cols-4",
        }
        const gaps = {
            sm: "gap-2",
            md: "gap-4",
            lg: "gap-8",
        }
        return (
            <div
                ref={ref}
                className={cn(
                    "grid",
                    responsive ? responsiveCols[columns] : fixedCols[columns],
                    gaps[gap],
                    getElevationClass(elevation),
                    getAnimationClass(animation),
                    className
                )}
                {...props}
            />
        )
    }
)
Grid.displayName = "Grid"

export const Container = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { elevation?: Elevation; animation?: Animation }>(
    ({ className, elevation = 0, animation = "none", ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "mx-auto w-full max-w-7xl px-4 md:px-6",
                getElevationClass(elevation),
                getAnimationClass(animation),
                className
            )}
            {...props}
        />
    )
)
Container.displayName = "Container"
