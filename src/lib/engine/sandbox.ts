// ============================================================
// Hardened Sandbox for Code Execution
// ============================================================
// Removes global window/document access, blocks eval,
// adds timeout protection, and catches infinite loops.
// ============================================================

/**
 * Dangerous globals that should be blocked in the sandbox.
 */
const BLOCKED_GLOBALS = [
  "window",
  "document",
  "globalThis",
  "self",
  "top",
  "parent",
  "frames",
  "location",
  "navigator",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "Worker",
  "SharedWorker",
  "ServiceWorker",
  "importScripts",
  "postMessage",
  "opener",
  "chrome",
  "process",
  "require",
  "module",
  "exports",
  "__dirname",
  "__filename",
];

/**
 * Patterns that indicate dangerous code.
 */
const DANGEROUS_PATTERNS = [
  /\beval\s*\(/g,
  /\bnew\s+Function\s*\(/g,
  /\bsetTimeout\s*\(\s*['"`]/g, // setTimeout with string arg
  /\bsetInterval\s*\(\s*['"`]/g,
  /\bdocument\s*\./g,
  /\bwindow\s*\./g,
  /\bglobalThis\s*\./g,
  /\bprocess\s*\./g,
  /\brequire\s*\(/g,
  /\bimport\s*\(/g,             // Dynamic imports
  /\b__proto__\b/g,
  /\bconstructor\s*\[/g,
  /\bObject\.getPrototypeOf/g,
  /\bReflect\b/g,
  /\bProxy\b/g,
];

/**
 * Infinite loop detection patterns.
 */
const LOOP_PATTERNS = [
  /while\s*\(\s*true\s*\)/g,
  /while\s*\(\s*1\s*\)/g,
  /for\s*\(\s*;\s*;\s*\)/g,
  /for\s*\(\s*;;\s*\)/g,
];

export interface SandboxResult {
  success: boolean;
  result: unknown;
  error?: string;
  executionTimeMs: number;
}

export interface SandboxOptions {
  timeoutMs?: number;
  maxCodeLength?: number;
}

/**
 * Static analysis: check code for dangerous patterns before execution.
 */
export function analyzeCode(code: string): { safe: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(code)) {
      issues.push(`Blocked pattern detected: ${pattern.source}`);
    }
  }

  // Check for potential infinite loops
  for (const pattern of LOOP_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(code)) {
      issues.push(`Potential infinite loop: ${pattern.source}`);
    }
  }

  return {
    safe: issues.length === 0,
    issues,
  };
}

/**
 * Create a sandboxed scope that blocks dangerous globals.
 * Returns an object of shadowed globals set to undefined.
 */
export function createBlockedScope(): Record<string, undefined> {
  const blocked: Record<string, undefined> = {};
  for (const name of BLOCKED_GLOBALS) {
    blocked[name] = undefined;
  }
  // Also block eval explicitly
  blocked["eval"] = undefined;
  return blocked;
}

/**
 * Execute code in a hardened sandbox with timeout protection.
 *
 * This enhances the existing `new Function` approach by:
 * 1. Shadowing dangerous globals as function parameters set to undefined
 * 2. Pre-scanning code for dangerous patterns
 * 3. Wrapping execution in a timeout
 * 4. Catching infinite loops via static analysis
 */
export function executeSandboxed(
  code: string,
  scope: Record<string, unknown>,
  options: SandboxOptions = {}
): SandboxResult {
  const { timeoutMs = 5000, maxCodeLength = 100000 } = options;
  const start = Date.now();

  // Length check
  if (code.length > maxCodeLength) {
    return {
      success: false,
      result: null,
      error: `Code exceeds maximum length (${maxCodeLength} chars)`,
      executionTimeMs: 0,
    };
  }

  // Static analysis
  const analysis = analyzeCode(code);
  if (!analysis.safe) {
    return {
      success: false,
      result: null,
      error: `Security violation: ${analysis.issues.join("; ")}`,
      executionTimeMs: 0,
    };
  }

  try {
    // Build combined scope: user scope + blocked globals
    const blockedScope = createBlockedScope();
    const combinedScope = { ...blockedScope, ...scope };

    // Create parameter names and values
    const paramNames = Object.keys(combinedScope);
    const paramValues = Object.values(combinedScope);

    // Wrap code with a timeout mechanism using a deadline check
    // Insert loop guards into while/for loops
    const guardedCode = injectLoopGuards(code, timeoutMs);

    // Create and execute the function
    const fn = new Function("__deadline__", ...paramNames, guardedCode);

    const deadline = Date.now() + timeoutMs;
    const result = fn(deadline, ...paramValues);

    return {
      success: true,
      result,
      executionTimeMs: Date.now() - start,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      result: null,
      error: msg,
      executionTimeMs: Date.now() - start,
    };
  }
}

/**
 * Inject loop guard checks into while/for loops.
 * Adds a deadline check at the start of each loop body.
 */
function injectLoopGuards(code: string, _timeoutMs: number): string {
  const loopGuard =
    'if (Date.now() > __deadline__) { throw new Error("Execution timeout: loop exceeded time limit"); }\n';

  // Add guard after opening braces of loops
  let result = code;

  // while (...) {  →  while (...) { GUARD
  result = result.replace(
    /(while\s*\([^)]*\)\s*\{)/g,
    `$1\n${loopGuard}`
  );

  // for (...) {  →  for (...) { GUARD
  result = result.replace(
    /(for\s*\([^)]*\)\s*\{)/g,
    `$1\n${loopGuard}`
  );

  // do {  →  do { GUARD
  result = result.replace(
    /(do\s*\{)/g,
    `$1\n${loopGuard}`
  );

  return result;
}

/**
 * Sanitize generated code by removing dangerous constructs.
 * This is a pre-processing step before transpilation.
 */
export function sanitizeGeneratedCode(code: string): string {
  let sanitized = code;

  // Remove any dangerouslySetInnerHTML
  sanitized = sanitized.replace(/dangerouslySetInnerHTML\s*=\s*\{[^}]*\}/g, "");

  // Remove any script tags (shouldn't be in JSX but just in case)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");

  // Remove any on* event handlers as inline strings
  sanitized = sanitized.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, "");

  return sanitized;
}
