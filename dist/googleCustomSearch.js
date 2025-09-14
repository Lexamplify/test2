import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;
export async function searchIndianKanoonWithCSE(query) {
    const url = `https://www.googleapis.com/customsearch/v1`;
    try {
        const res = await axios.get(url, {
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
