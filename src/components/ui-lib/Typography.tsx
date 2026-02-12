import * as React from "react"
import { cn } from "@/lib/utils"
import type { Elevation, Animation } from "@/lib/design-tokens"
import { getElevationClass, getAnimationClass } from "@/lib/design-tokens"

export const Heading = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement> & { level?: 1 | 2 | 3 | 4; elevation?: Elevation; animation?: Animation }>(
    ({ className, level = 1, elevation = 0, animation = "none", ...props }, ref) => {
        const Component = `h${level}` as any
        const styles = {
            1: "text-4xl font-extrabold tracking-tight lg:text-5xl",
            2: "text-3xl font-semibold tracking-tight first:mt-0",
            3: "text-2xl font-semibold tracking-tight",
            4: "text-xl font-semibold tracking-tight",
        }
        return (
            <Component
                ref={ref}
                className={cn(
                    "scroll-m-20 text-gray-900 dark:text-gray-50",
                    styles[level],
                    getElevationClass(elevation),
                    getAnimationClass(animation),
                    className
                )}
                {...props}
            />
        )
    }
)
Heading.displayName = "Heading"

export const Text = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement> & { size?: "sm" | "md" | "lg"; type?: "default" | "muted"; elevation?: Elevation; animation?: Animation }>(
    ({ className, size = "md", type = "default", elevation = 0, animation = "none", ...props }, ref) => {
        const sizes = {
            sm: "text-sm",
            md: "text-base",
            lg: "text-lg font-semibold",
        }
        const types = {
            default: "text-gray-900 dark:text-gray-100",
            muted: "text-gray-500 dark:text-gray-400",
        }
        return (
            <p
                ref={ref}
                className={cn(
                    "leading-7",
                    sizes[size],
                    types[type],
                    getElevationClass(elevation),
                    getAnimationClass(animation),
                    className
                )}
                {...props}
            />
        )
    }
)
Text.displayName = "Text"
