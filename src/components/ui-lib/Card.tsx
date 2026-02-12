import * as React from "react"
import { cn } from "@/lib/utils"
import type { Variant, Elevation, Animation } from "@/lib/design-tokens"
import { getElevationClass, getAnimationClass } from "@/lib/design-tokens"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: Variant
    elevation?: Elevation
    animation?: Animation
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = "primary", elevation = 1, animation = "none", ...props }, ref) => {
        const variants = {
            primary: "border bg-white text-gray-950 dark:bg-gray-900 dark:text-gray-50 dark:border-gray-800",
            secondary: "border bg-gray-50 text-gray-950 dark:bg-gray-800 dark:text-gray-50 dark:border-gray-700",
            ghost: "border-transparent bg-transparent text-gray-950 dark:text-gray-50",
        }
        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-lg transition-all duration-200",
                    variants[variant],
                    getElevationClass(elevation),
                    getAnimationClass(animation),
                    className
                )}
                {...props}
            />
        )
    }
)
Card.displayName = "Card"

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("flex flex-col space-y-1.5 p-6", className)}
            {...props}
        />
    )
)
CardHeader.displayName = "CardHeader"

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3
            ref={ref}
            className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
            {...props}
        />
    )
)
CardTitle.displayName = "CardTitle"

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p
            ref={ref}
            className={cn("text-sm text-gray-500", className)}
            {...props}
        />
    )
)
CardDescription.displayName = "CardDescription"

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
    )
)
CardContent.displayName = "CardContent"

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("flex items-center p-6 pt-0", className)}
            {...props}
        />
    )
)
CardFooter.displayName = "CardFooter"
