"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import type { Variant, Elevation, Animation } from "@/lib/design-tokens"
import { getElevationClass, getAnimationClass } from "@/lib/design-tokens"

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
    children?: React.ReactNode
    variant?: Variant
    elevation?: Elevation
    animation?: Animation
    collapsible?: boolean
    defaultCollapsed?: boolean
}

export const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
    ({ className, children, variant = "primary", elevation = 0, animation = "none", collapsible = false, defaultCollapsed = false, ...props }, ref) => {
        const [collapsed, setCollapsed] = React.useState(defaultCollapsed)

        const variantClasses = {
            primary: "bg-gray-50/80 dark:bg-gray-900/80 border-r border-gray-200 dark:border-gray-800",
            secondary: "bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800",
            ghost: "bg-transparent border-r border-transparent",
        }

        return (
            <aside
                ref={ref}
                className={cn(
                    "flex h-full flex-col p-4 transition-all duration-300",
                    collapsed ? "w-16" : "w-64",
                    variantClasses[variant],
                    getElevationClass(elevation),
                    getAnimationClass(animation),
                    className
                )}
                {...props}
            >
                {collapsible && (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="mb-4 self-end rounded-md p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
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
                            className={cn("transition-transform duration-200", collapsed && "rotate-180")}
                        >
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                )}
                <div className={cn("flex flex-col gap-1 flex-1", collapsed && "items-center")}>
                    {React.Children.map(children, (child) => {
                        if (React.isValidElement(child)) {
                            return React.cloneElement(child as React.ReactElement<SidebarItemProps>, {
                                collapsed: collapsed,
                            } as Partial<SidebarItemProps>)
                        }
                        return child
                    })}
                </div>
            </aside>
        )
    }
)
Sidebar.displayName = "Sidebar"

interface SidebarItemProps extends React.HTMLAttributes<HTMLDivElement> {
    isActive?: boolean
    icon?: React.ReactNode
    collapsed?: boolean
}

export const SidebarItem = React.forwardRef<HTMLDivElement, SidebarItemProps>(
    ({ className, isActive, icon, collapsed, children, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                isActive
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50"
                    : "text-gray-500 dark:text-gray-400",
                collapsed && "justify-center px-2",
                className
            )}
            title={collapsed && typeof children === "string" ? children : undefined}
            {...props}
        >
            {icon && <span className="h-4 w-4 shrink-0">{icon}</span>}
            {!collapsed && children}
        </div>
    )
)
SidebarItem.displayName = "SidebarItem"
