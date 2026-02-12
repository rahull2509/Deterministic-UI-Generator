const apiKey = process.env.GEMINI_API_KEY || "AIzaSyClJX9D0Tkn15JbUgnH5y9rH78UR0lJLsw";
const model = "gemini-2.0-flash-001";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

console.log("Testing URL:", url);

async function test() {
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello" }] }]
            })
        });

        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Body:", text);
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
