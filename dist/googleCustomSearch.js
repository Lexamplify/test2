"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchIndianKanoonWithCSE = searchIndianKanoonWithCSE;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;
async function searchIndianKanoonWithCSE(query) {
    const url = `https://www.googleapis.com/customsearch/v1`;
    try {
        const res = await axios_1.default.get(url, {
            params: {
                key: API_KEY,
                cx: SEARCH_ENGINE_ID,
                q: query,
            },
        });
        const items = res.data.items || [];
        for (const item of items.slice(0, 5)) {
            if (item.link.includes('indiankanoon.org')) {
                return item.link;
            }
        }
        return null;
    }
    catch (err) {
        console.error('[Google CSE Error]', err.message);
        return null;
    }
}
