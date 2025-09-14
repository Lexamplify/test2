import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'https://api.indiankanoon.org/';
const API_TOKEN = process.env.INDIANKANOON_TOKEN as string;
export async function searchIndianKanoon(title: string): Promise<string | null> {
    const queries = [
      title,
      title.replace(/vs/i, 'v.'),
      title.replace(/vs/i, 'v'),
      title.replace(/vs.*/i, '').trim(), // Remove "vs State Of..."
      'Nanavati Maharashtra 1961',
      'K.M. Nanavati case',
    ];
  
    for (const query of queries) {
      try {
        const res = await axios.post(
          `${API_BASE_URL}search/`,
          {
            title: query,
            format: 'json',
          },
          {
            headers: {
              Authorization: `Token ${API_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );
  
        const results = res.data.results;
  
        if (results && results.length > 0) {
          const bestMatch = results.find((doc: any) =>
            doc.title.toLowerCase().includes('nanavati')
          ) || results[0];
  
          return bestMatch.url.startsWith('http')
            ? bestMatch.url
            : `https://indiankanoon.org${bestMatch.url}`;
        }
      } catch (error: any) {
        console.error(`[Indian Kanoon API Error: query="${query}"]`, error.response?.data || error.message);
      }
    }
  
    return null;
  }
  