import { NextRequest } from "next/server";
import { PLANNER_PROMPT, GENERATOR_PROMPT, EXPLAINER_PROMPT } from "@/lib/agent/prompts";
import { validateComponentUsage, sanitizeUserInput, detectPromptInjection, generateValidationSummary } from "@/lib/validation";
import { rateLimiter, getClientIdentifier } from "@/lib/security";
import { orchestratedGenerate, generateText as orchestratedGenerateText } from "@/lib/engine/llm-orchestrator";
import { validateUIAST, PlannerOutputSchema, type PlannerOutput, type UIAST } from "@/lib/schema/ui-ast";
import { generateCodeFromAST } from "@/lib/engine/ast-to-code";
import { applyPatches, createEmptyAST } from "@/lib/engine/patch-engine";

export const maxDuration = 60;

function extractJSON(text: string): string {
    // Try to extract JSON from markdown code blocks
    const jsonBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlock) return jsonBlock[1].trim();
    // Try raw JSON
    const rawJson = text.match(/\{[\s\S]*\}/);
    if (rawJson) return rawJson[0];
    return text;
}

function extractCode(text: string): string {
    const codeBlock = text.match(/```(?:tsx|typescript|javascript|jsx)\s*([\s\S]*?)```/);
    return codeBlock ? codeBlock[1].trim() : text.trim();
}

/**
 * Schema validator for the LLM orchestrator.
 * Returns true if the text can be parsed as valid PlannerOutput JSON.
 */
function plannerSchemaValidator(text: string): boolean {
    try {
        const jsonStr = extractJSON(text);
        const parsed = JSON.parse(jsonStr);
        const result = PlannerOutputSchema.safeParse(parsed);
        return result.success;
    } catch {
        return false;
    }
}

export async function POST(req: NextRequest) {
    try {
        // Rate limiting
        const clientId = getClientIdentifier(req.headers);
        if (!rateLimiter.check(clientId)) {
            return new Response(
                JSON.stringify({ error: "Rate limit exceeded. Please try again in a minute." }),
                { status: 429, headers: { "Content-Type": "application/json" } }
            );
        }

        const body = await req.json();
        const { messages, apiKey, currentCode, currentAST } = body;
        const rawUserRequest = messages[messages.length - 1].content;

        // Sanitize input
        const userRequest = sanitizeUserInput(rawUserRequest);
        if (detectPromptInjection(userRequest)) {
            console.warn("[Security] Potential prompt injection detected");
        }

        const openaiKey = process.env.OPENAI_API_KEY_1 || apiKey;
        const geminiKey = process.env.GEMINI_API_KEY_1 || apiKey;
        const llmOpts = { openaiKey, geminiKey };

        // ---- STREAMING RESPONSE ----
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                function send(event: string, data: unknown) {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ event, data })}\n\n`)
                    );
                }

                try {
                    // =========== STEP 1: PLANNER ===========
                    send("step", { step: "planner", status: "start" });

                    const plannerPrompt = PLANNER_PROMPT
                        .replace("{{userRequest}}", userRequest)
                        .replace("{{currentCode}}", currentCode || "None")
                        .replace("{{currentAST}}", currentAST ? JSON.stringify(currentAST) : "None");

                    const planResult = await orchestratedGenerate(plannerPrompt, {
                        ...llmOpts,
                        schemaValidator: plannerSchemaValidator,
                    });

                    const planJsonStr = extractJSON(planResult.text);
                    let plan: PlannerOutput;
                    try {
                        plan = PlannerOutputSchema.parse(JSON.parse(planJsonStr));
                    } catch (parseErr) {
                        // Fallback: try to extract and use anyway
                        const rawPlan = JSON.parse(planJsonStr);
                        plan = {
                            modificationType: "new",
                            layout: rawPlan.layout || "Stack",
                            theme: rawPlan.theme || "light",
                            components: rawPlan.components || rawPlan.structure || [],
                            reasoning: rawPlan.reasoning || "Generated from request",
                        };
                    }

                    send("step", {
                        step: "planner",
                        status: "complete",
                        data: plan,
                        model: planResult.metrics.model,
                        latencyMs: planResult.metrics.latencyMs,
                    });

                    // =========== STEP 2: GENERATOR ===========
                    send("step", { step: "generator", status: "start" });

                    let finalAST: UIAST;
                    let code: string;

                    if (plan.modificationType === "patch" && currentAST) {
                        // INCREMENTAL EDIT: apply patches
                        const baseAST: UIAST = typeof currentAST === "string"
                            ? JSON.parse(currentAST)
                            : currentAST;
                        const patchResult = applyPatches(baseAST, plan.patches);

                        if (!patchResult.success) {
                            send("step", {
                                step: "generator",
                                status: "warning",
                                data: `Patch warnings: ${patchResult.errors.join("; ")}`,
                            });
                        }

                        finalAST = patchResult.ast;
                        const genResult = generateCodeFromAST(finalAST);
                        code = genResult.code;

                        if (genResult.errors.length > 0) {
                            send("step", {
                                step: "generator",
                                status: "warning",
                                data: `Code generation warnings: ${genResult.errors.join("; ")}`,
                            });
                        }
                    } else if (plan.modificationType === "new" && plan.components) {
                        // NEW GENERATION from AST
                        finalAST = {
                            layout: plan.layout,
                            theme: plan.theme || "light",
                            components: plan.components,
                        };

                        // Validate AST
                        const astValidation = validateUIAST(finalAST);
                        if (!astValidation.valid) {
                            send("step", {
                                step: "generator",
                                status: "warning",
                                data: `AST validation issues: ${astValidation.errors.join("; ")}`,
                            });
                        }

                        const genResult = generateCodeFromAST(finalAST);
                        code = genResult.code;

                        if (genResult.errors.length > 0) {
                            // Fallback: use LLM to generate code directly
                            const generatorPrompt = GENERATOR_PROMPT
                                .replace("{{plan}}", JSON.stringify(plan, null, 2))
                                .replace("{{currentCode}}", currentCode || "None")
                                .replace("{{modificationType}}", plan.modificationType);

                            const codeResponse = await orchestratedGenerateText(generatorPrompt, llmOpts);
                            code = extractCode(codeResponse);
                        }
                    } else {
                        // FALLBACK: direct LLM code generation
                        finalAST = createEmptyAST();
                        const generatorPrompt = GENERATOR_PROMPT
                            .replace("{{plan}}", JSON.stringify(plan, null, 2))
                            .replace("{{currentCode}}", currentCode || "None")
                            .replace("{{modificationType}}", plan.modificationType);

                        const codeResponse = await orchestratedGenerateText(generatorPrompt, llmOpts);
                        code = extractCode(codeResponse);
                    }

                    // Validate generated code
                    const validationResult = validateComponentUsage(code);
                    const validationSummary = generateValidationSummary(validationResult);

                    send("step", {
                        step: "generator",
                        status: "complete",
                        data: { code, ast: finalAST, validation: validationSummary },
                    });

                    // =========== STEP 3: EXPLAINER ===========
                    send("step", { step: "explainer", status: "start" });

                    const explainerPrompt = EXPLAINER_PROMPT
                        .replace("{{userRequest}}", userRequest)
                        .replace("{{planReasoning}}", plan.reasoning || "Generated")
                        .replace("{{modificationType}}", plan.modificationType)
                        .replace("{{modifications}}", plan.modificationType === "patch"
                            ? plan.patches.map(p => `${p.action} at ${p.targetPath}`).join(", ")
                            : "N/A"
                        )
                        .replace("{{preserved}}", "Existing structure preserved where applicable");

                    const explanation = await orchestratedGenerateText(explainerPrompt, llmOpts);

                    send("step", {
                        step: "explainer",
                        status: "complete",
                        data: explanation,
                    });

                    // =========== FINAL ===========
                    send("done", {
                        plan,
                        code,
                        ast: finalAST,
                        explanation,
                        validation: validationSummary,
                    });
                } catch (error: unknown) {
                    const msg = error instanceof Error ? error.message : String(error);
                    console.error("[Agent Error]", msg);
                    send("error", { message: msg });
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
            },
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("[Route Error]", msg);
        return new Response(
            JSON.stringify({ error: msg }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
