const MODELS = [
    // Validated 2.0/2.5 models available to the user's key
    "gemini-2.0-flash-001",
    "gemini-2.0-flash", // Fallback alias
    "gemini-2.5-flash",
    "gemini-flash-latest",

    // Fallbacks
    "gemini-pro",
    "gpt-4o",
    "gpt-3.5-turbo"
];

export async function generateText(prompt: string, apiKey: string = ""): Promise<string> {
    const openAIKey = process.env.OPENAI_API_KEY_1;
    const geminiKey = process.env.GEMINI_API_KEY_1;

    // DEBUG: Check what keys are available
    console.log('=== API Key Status ===');
    console.log('OpenAI Key:', openAIKey ? `Set (${openAIKey.substring(0, 7)}...)` : 'NOT SET');
    console.log('Gemini Key:', geminiKey ? `Set (${geminiKey.substring(0, 7)}...)` : 'NOT SET');
    console.log('Provided apiKey:', apiKey ? `Set (${apiKey.substring(0, 7)}...)` : 'NOT SET');
    console.log('=====================\n');

    if (!apiKey && !openAIKey && !geminiKey) {
        return "Error: No API Key provided. Please set OPENAI_API_KEY or GEMINI_API_KEY.";
    }

    let lastError = null;
    const attemptedModels: string[] = [];
    const failedModels: { model: string, reason: string }[] = [];

    for (const model of MODELS) {
        attemptedModels.push(model);

        try {
            console.log(`\n[${attemptedModels.length}/${MODELS.length}] Attempting: ${model}`);

            let response;
            if (model.startsWith("gpt")) {
                const keyToUse = openAIKey || apiKey;
                if (!keyToUse) {
                    const reason = 'No OpenAI key available';
                    console.warn(`❌ ${reason}, skipping...`);
                    failedModels.push({ model, reason });
                    continue;
                }

                console.log(`   Using OpenAI key: ${keyToUse.substring(0, 7)}...`);
                response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${keyToUse}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [{ role: "user", content: prompt }]
                    })
                });
            } else if (model.startsWith("gemini")) {
                const keyToUse = geminiKey || apiKey;
                if (!keyToUse) {
                    const reason = 'No Gemini key available';
                    console.warn(`❌ ${reason}, skipping...`);
                    failedModels.push({ model, reason });
                    continue;
                }

                console.log(`   Using Gemini key: ${keyToUse.substring(0, 7)}...`);
                // Use v1beta API as v1 doesn't support 1.5 models yet
                response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyToUse}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }]
                    })
                });
            }

            if (!response) {
                const reason = 'No response object';
                console.warn(`❌ ${reason}, skipping...`);
                failedModels.push({ model, reason });
                lastError = new Error(`Model ${model}: No response object created`);
                continue;
            }

            if (!response.ok) {
                const errorText = await response.text();
                const recoverableStatusCodes = [400, 401, 404, 429, 503];

                if (recoverableStatusCodes.includes(response.status)) {
                    const reason = `Status ${response.status}`;
                    console.warn(`❌ ${reason}, trying next model...`);
                    failedModels.push({ model, reason });
                    lastError = new Error(`Model ${model} error (${response.status}): ${errorText}`);
                    continue;
                }

                throw new Error(`API Error (${model}): ${errorText}`);
            }

            const data = await response.json();

            if (model.startsWith("gpt")) {
                console.log(`✅ Success with ${model}!`);
                return data.choices[0].message.content;
            } else {
                console.log(`✅ Success with ${model}!`);
                return data.candidates[0].content.parts[0].text;
            }

        } catch (error: any) {
            console.error(`❌ ${model} failed:`, error.message);
            failedModels.push({ model, reason: error.message });
            lastError = error;
            continue;
        }
    }

    // All models failed - provide detailed summary
    console.error('\n=== ALL MODELS FAILED ===');
    console.error('Failed models:', failedModels);
    console.error('========================\n');

    throw lastError || new Error("All models failed.");
}