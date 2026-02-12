import * as React from "react"
import { cn } from "@/lib/utils"
import type { Elevation, Animation } from "@/lib/design-tokens"
import { getElevationClass, getAnimationClass } from "@/lib/design-tokens"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive"
    size?: "sm" | "md" | "lg" | "icon"
    elevation?: Elevation
    animation?: Animation
    isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", elevation = 0, animation = "none", isLoading, children, ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"

        const variants = {
            primary: "bg-blue-600 text-white shadow hover:bg-blue-700 active:bg-blue-800",
            secondary: "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
            outline: "border border-gray-200 bg-transparent shadow-sm hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-100",
            ghost: "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:text-gray-300",
            destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600 active:bg-red-700",
        }

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-9 px-4 py-2",
            lg: "h-10 px-8 text-base",
            icon: "h-9 w-9",
        }

        return (
            <button
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    getElevationClass(elevation),
                    getAnimationClass(animation),
                    className
                )}
                ref={ref}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
                {children}
            </button>
        )
    }
)
Button.displayName = "Button"
