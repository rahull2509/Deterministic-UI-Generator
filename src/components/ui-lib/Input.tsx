import * as React from "react"
import { cn } from "@/lib/utils"
import type { Elevation, Animation } from "@/lib/design-tokens"
import { getElevationClass, getAnimationClass } from "@/lib/design-tokens"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    elevation?: Elevation
    animation?: Animation
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, elevation = 0, animation = "none", ...props }, ref) => {
        return (
            <div className={cn("w-full space-y-2", getAnimationClass(animation))}>
                {label && (
                    <label className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {label}
                    </label>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-9 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
                        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                        "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "text-gray-900 dark:text-gray-100",
                        error && "border-red-500 focus-visible:ring-red-500/50",
                        getElevationClass(elevation),
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
        )
    }
)
Input.displayName = "Input"
