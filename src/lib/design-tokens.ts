// ============================================================
// Deterministic Design Token Engine
// ============================================================
// AI may ONLY reference variant/size/elevation/animation props.
// This module maps those props to Tailwind classes internally.
// AI never sees or produces raw class names.
// ============================================================

export const DESIGN_TOKENS = {
  colors: {
    primary: {
      light: {
        bg: "bg-blue-600",
        bgHover: "hover:bg-blue-700",
        text: "text-white",
        border: "border-blue-600",
        surface: "bg-blue-50",
        accent: "text-blue-600",
      },
      dark: {
        bg: "bg-blue-500",
        bgHover: "hover:bg-blue-400",
        text: "text-white",
        border: "border-blue-500",
        surface: "bg-blue-950",
        accent: "text-blue-400",
      },
    },
    secondary: {
      light: {
        bg: "bg-gray-100",
        bgHover: "hover:bg-gray-200",
        text: "text-gray-900",
        border: "border-gray-200",
        surface: "bg-gray-50",
        accent: "text-gray-600",
      },
      dark: {
        bg: "bg-gray-800",
        bgHover: "hover:bg-gray-700",
        text: "text-gray-100",
        border: "border-gray-700",
        surface: "bg-gray-900",
        accent: "text-gray-400",
      },
    },
    ghost: {
      light: {
        bg: "bg-transparent",
        bgHover: "hover:bg-gray-100",
        text: "text-gray-700",
        border: "border-transparent",
        surface: "bg-transparent",
        accent: "text-gray-500",
      },
      dark: {
        bg: "bg-transparent",
        bgHover: "hover:bg-gray-800",
        text: "text-gray-300",
        border: "border-transparent",
        surface: "bg-transparent",
        accent: "text-gray-500",
      },
    },
    background: {
      light: "bg-white",
      dark: "bg-gray-950",
    },
    surface: {
      light: "bg-gray-50",
      dark: "bg-gray-900",
    },
    muted: {
      light: { text: "text-gray-500", bg: "bg-gray-100" },
      dark: { text: "text-gray-400", bg: "bg-gray-800" },
    },
  },

  radius: {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  },

  spacing: {
    none: "p-0",
    xs: "p-1",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
    "2xl": "p-12",
  },

  spacingGap: {
    none: "gap-0",
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  },

  typography: {
    h1: "text-4xl font-extrabold tracking-tight lg:text-5xl",
    h2: "text-3xl font-semibold tracking-tight",
    h3: "text-2xl font-semibold tracking-tight",
    h4: "text-xl font-semibold tracking-tight",
    body: {
      sm: "text-sm leading-6",
      md: "text-base leading-7",
      lg: "text-lg font-semibold leading-7",
    },
  },

  elevation: {
    0: "",
    1: "shadow-sm",
    2: "shadow-md",
    3: "shadow-lg",
  } as Record<number, string>,

  animation: {
    none: "",
    fade: "animate-in fade-in duration-300",
    slide: "animate-in slide-in-from-bottom-4 duration-300",
  } as Record<string, string>,

  size: {
    sm: { height: "h-8", padding: "px-3 py-1", text: "text-xs" },
    md: { height: "h-9", padding: "px-4 py-2", text: "text-sm" },
    lg: { height: "h-10", padding: "px-6 py-3", text: "text-base" },
  } as Record<string, { height: string; padding: string; text: string }>,
} as const;

// ============================================================
// Token resolver functions
// ============================================================

export type Theme = "light" | "dark";
export type Variant = "primary" | "secondary" | "ghost";
export type Size = "sm" | "md" | "lg";
export type Elevation = 0 | 1 | 2 | 3;
export type Animation = "none" | "fade" | "slide";

export function getVariantClasses(variant: Variant, theme: Theme) {
  return DESIGN_TOKENS.colors[variant][theme];
}

export function getElevationClass(elevation: Elevation): string {
  return DESIGN_TOKENS.elevation[elevation] ?? "";
}

export function getAnimationClass(animation: Animation): string {
  return DESIGN_TOKENS.animation[animation] ?? "";
}

export function getSizeClasses(size: Size) {
  return DESIGN_TOKENS.size[size];
}

export function getBackgroundClass(theme: Theme): string {
  return DESIGN_TOKENS.colors.background[theme];
}

export function getSurfaceClass(theme: Theme): string {
  return DESIGN_TOKENS.colors.surface[theme];
}

export function getMutedClasses(theme: Theme) {
  return DESIGN_TOKENS.colors.muted[theme];
}

/**
 * Combine token-driven classes for a component.
 * Standard usage by UI-lib components. AI never calls this directly.
 */
export function resolveTokenClasses(opts: {
  variant?: Variant;
  size?: Size;
  elevation?: Elevation;
  animation?: Animation;
  theme?: Theme;
}): string {
  const theme = opts.theme ?? "light";
  const parts: string[] = [];

  if (opts.variant) {
    const v = getVariantClasses(opts.variant, theme);
    parts.push(v.bg, v.bgHover, v.text, v.border);
  }

  if (opts.elevation !== undefined) {
    parts.push(getElevationClass(opts.elevation));
  }

  if (opts.animation && opts.animation !== "none") {
    parts.push(getAnimationClass(opts.animation));
  }

  return parts.filter(Boolean).join(" ");
}
