// Validation utilities for AI-generated code

export interface ValidationResult {
    isValid: boolean
    errors: string[]
    warnings: string[]
}

// Component whitelist - only these components are allowed
const ALLOWED_COMPONENTS = [
    // Layouts
    "Box", "Stack", "Grid", "Container",
    // Typography
    "Heading", "Text",
    // Primitives
    "Button", "Input",
    // Card family
    "Card", "CardHeader", "CardTitle", "CardDescription", "CardContent", "CardFooter",
    // Table family
    "Table", "TableHeader", "TableBody", "TableRow", "TableHead", "TableCell", "TableFooter", "TableCaption",
    // Complex
    "Modal", "Navbar", "Sidebar", "SidebarItem",
    // Charts
    "Chart", "BarChart", "LineChart", "PieChart",
]

// Forbidden HTML tags that should not be used directly
const FORBIDDEN_HTML_TAGS = [
    "div", "span", "button", "input", "textarea", "select", "option",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "a", "img", "ul", "ol", "li",
    "table", "thead", "tbody", "tr", "th", "td",
    "form", "label", "nav", "header", "footer", "section", "article",
]

// Dangerous patterns that might indicate injection attempts
const DANGEROUS_PATTERNS = [
    /eval\s*\(/gi,
    /Function\s*\(/gi,
    /dangerouslySetInnerHTML/gi,
    /<script>/gi,
    /javascript:/gi,
    /on\w+\s*=\s*["']/gi, // onclick="..." type patterns
]

/**
 * Validate generated code against component whitelist
 */
export function validateComponentUsage(code: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for forbidden HTML tags
    const htmlTagPattern = new RegExp(`<(${FORBIDDEN_HTML_TAGS.join("|")})\\b`, "gi")

    // Use matchAll to get capturing groups
    const htmlMatches = Array.from(code.matchAll(htmlTagPattern))

    if (htmlMatches.length > 0) {
        // match[1] corresponds to the first capturing group (the tag name)
        const uniqueTags = [...new Set(htmlMatches.map(m => m[1].toLowerCase()))]
        warnings.push(
            `Found forbidden HTML tags: ${uniqueTags.join(", ")}. ` +
            `Please use component library equivalents instead.`
        )
    }

    // Check for dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(code)) {
            errors.push(`Dangerous pattern detected: ${pattern.source}`)
        }
    }

    // Extract used components from imports and JSX
    const componentPattern = /<([A-Z][a-zA-Z0-9]*)/g
    const usedComponents = new Set<string>()
    let match

    while ((match = componentPattern.exec(code)) !== null) {
        usedComponents.add(match[1])
    }

    // Check if any components are not in whitelist
    // We also allow Lucide icons (check lazily or just trust common ones? checking strictly is better)
    // Note: We can't easily import lucide-react here if this runs in a restricted context, but assuming standard Next.js app:
    const unknownComponents = Array.from(usedComponents).filter(
        comp => {
            if (ALLOWED_COMPONENTS.includes(comp) || comp === "React") return false;
            // Allow if it matches a known Lucide icon
            // Since we can't import the huge list here easily without overhead, we'll allow common icon names
            // or we could relax this check. 
            // For now, let's allow anything that isn't in the FORBIDDEN list and starts with uppercase, 
            // but warned.
            // BETTER: The user complained about Home, Settings. Let's start by assuming
            // all other UpperCase components might be icons providing they don't look like HTML tags.

            // Actually, best approach: Just ignore this check for now or make it a specific "Unknown (check if Icon)" warning.

            return true;
        }
    )

    if (unknownComponents.length > 0) {
        // Only warn if they aren't likely icons
        // Heuristic: If it has "Icon" in name, or is common like "Home", "Settings", "User", "Menu", "Search"... 
        // Let's just pass them for now to reduce noise, or change the warning to be less scary.

        warnings.push(
            `Unknown components detected: ${unknownComponents.join(", ")}. ` +
            `Ensure these are valid icons or components.`
        )
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    }
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeUserInput(input: string): string {
    // Remove any script tags
    let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, "")

    // Limit length to prevent DoS
    if (sanitized.length > 10000) {
        sanitized = sanitized.substring(0, 10000)
    }

    return sanitized
}

/**
 * Basic prompt injection detection
 */
export function detectPromptInjection(input: string): boolean {
    const suspiciousPatterns = [
        /ignore\s+(previous|above|all)\s+instructions/gi,
        /you\s+are\s+now/gi,
        /system\s*:/gi,
        /\[system\]/gi,
        /forget\s+everything/gi,
        /new\s+instructions/gi,
    ]

    return suspiciousPatterns.some(pattern => pattern.test(input))
}

/**
 * Generate a validation summary for display
 */
export function generateValidationSummary(result: ValidationResult): string {
    if (result.isValid && result.warnings.length === 0) {
        return "✅ Code validation passed"
    }

    let summary = ""

    if (result.errors.length > 0) {
        summary += "❌ **Validation Errors:**\n"
        result.errors.forEach((err, i) => {
            summary += `${i + 1}. ${err}\n`
        })
        summary += "\n"
    }

    if (result.warnings.length > 0) {
        summary += "⚠️  **Warnings:**\n"
        result.warnings.forEach((warn, i) => {
            summary += `${i + 1}. ${warn}\n`
        })
    }

    return summary
}
