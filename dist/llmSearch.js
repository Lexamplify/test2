"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findCaseUrlWithLLM = findCaseUrlWithLLM;
// llmSearch.ts
const openai_1 = require("openai");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const openai = new openai_1.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
async function findCaseUrlWithLLM(title) {
    try {
        const prompt = `
You are a legal AI assistant. Your task is to find the **exact Indian Kanoon URL** for a given case title.

Case Title: "${title}"

Output Requirements:
- Return only the **direct Indian Kanoon case URL** (e.g., https://indiankanoon.org/doc/1596139/)
- If you **cannot find** the case, return exactly: **not found**
- Do NOT explain anything. No extra text. No markdown. Only the URL or "not found".

Begin output:
`;
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            max_tokens: 100,
        });
        const result = response.choices[0].message.content?.trim() || '';
        if (result.toLowerCase() === 'not found' || !result.startsWith('http'))
            return null;
        return result;
    }
    catch (error) {
        console.error('[LLM Search] Error:', error);
        return null;
    }
}
