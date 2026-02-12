"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import type { Variant, Elevation, Animation } from "@/lib/design-tokens"
import { getElevationClass, getAnimationClass } from "@/lib/design-tokens"

interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
    logo?: React.ReactNode
    children?: React.ReactNode
    variant?: Variant
    elevation?: Elevation
    animation?: Animation
    hasDropdown?: boolean
}

export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
    ({ className, logo, children, variant = "primary", elevation = 1, animation = "none", hasDropdown = false, ...props }, ref) => {
        const [dropdownOpen, setDropdownOpen] = React.useState(false)

        const variantClasses = {
            primary: "bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800",
            secondary: "bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800",
            ghost: "bg-transparent border-b border-transparent",
        }

        return (
            <nav
                ref={ref}
                className={cn(
                    "flex h-16 items-center px-4 md:px-6 transition-all duration-200",
                    variantClasses[variant],
                    getElevationClass(elevation),
                    getAnimationClass(animation),
                    className
                )}
                {...props}
            >
                {logo && <div className="mr-4 flex items-center font-bold text-lg text-gray-900 dark:text-gray-50">{logo}</div>}
                <div className="flex flex-1 items-center justify-end space-x-4">
                    {children}
                    {hasDropdown && (
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                Menu
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={cn("transition-transform duration-200", dropdownOpen && "rotate-180")}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            {dropdownOpen && (
                                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-1 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                        Profile
                                    </button>
                                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                        Settings
                                    </button>
                                    <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
                                    <button className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </nav>
        )
    }
)
Navbar.displayName = "Navbar"
