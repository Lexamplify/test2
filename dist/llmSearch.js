"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findCaseUrlWithLLM = findCaseUrlWithLLM;
// llmSearch.ts
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
async function findCaseUrlWithLLM(title) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
You are a legal AI assistant. Your task is to find the **exact Indian Kanoon URL** for a given case title.

Case Title: "${title}"

Output Requirements:
- Return only the **direct Indian Kanoon case URL** (e.g., https://indiankanoon.org/doc/1596139/)
- If you **cannot find** the case, return exactly: **not found**
- Do NOT explain anything. No extra text. No markdown. Only the URL or "not found".

Begin output:
`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        if (text.toLowerCase() === 'not found' || !text.startsWith('http'))
            return null;
        return text;
    }
    catch (error) {
        console.error('[LLM Search] Error:', error);
        return null;
    }
}
