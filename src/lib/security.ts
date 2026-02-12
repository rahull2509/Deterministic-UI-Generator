// Basic security utilities

/**
 * Simple in-memory rate limiter
 * In production, use Redis or similar
 */
class RateLimiter {
    private requests: Map<string, number[]> = new Map()
    private readonly maxRequests: number
    private readonly windowMs: number

    constructor(maxRequests: number = 10, windowMs: number = 60000) {
        this.maxRequests = maxRequests
        this.windowMs = windowMs
    }

    check(identifier: string): boolean {
        const now = Date.now()
        const userRequests = this.requests.get(identifier) || []

        // Remove old requests outside the window
        const validRequests = userRequests.filter(time => now - time < this.windowMs)

        if (validRequests.length >= this.maxRequests) {
            return false // Rate limit exceeded
        }

        validRequests.push(now)
        this.requests.set(identifier, validRequests)

        return true
    }

    reset(identifier: string): void {
        this.requests.delete(identifier)
    }
}

// Export a singleton instance
export const rateLimiter = new RateLimiter(20, 60000) // 20 requests per minute

/**
 * Validate API key format (basic check)
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== "string") {
        return false
    }

    // Gemini keys typically start with "AIza"
    // OpenAI keys typically start with "sk-"
    return apiKey.length > 20 && (
        apiKey.startsWith("AIza") ||
        apiKey.startsWith("sk-") ||
        apiKey.startsWith("gsk_") // Groq keys
    )
}

/**
 * Get client identifier from request (IP address or similar)
 * Note: This is a simplified version. In production, use proper IP detection
 */
export function getClientIdentifier(headers: Headers): string {
    // Try to get real IP from various headers
    const forwarded = headers.get("x-forwarded-for")
    const realIp = headers.get("x-real-ip")
    const cfConnectingIp = headers.get("cf-connecting-ip")

    return forwarded?.split(",")[0].trim() ||
        realIp ||
        cfConnectingIp ||
        "unknown"
}
