/* /* // index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { findCaseUrlWithLLM } from './llmSearch';
import { findIndianKanoonUrlFromGoogle } from './googleSearch';
import path from 'path';

const __dirname = path.resolve();

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/find-case-url', async (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid title' });
  }

  // Step 1: Try LLM
   const llmUrl = await findCaseUrlWithLLM(title);
  if (llmUrl) {
    return res.json({ source: 'llm', url: llmUrl });
  }
 
  // Step 2: Try Google fallback
  const googleUrl = await findIndianKanoonUrlFromGoogle(title);
  if (googleUrl) {
    return res.json({ source: 'google', url: googleUrl });
  }

  return res.status(404).json({ url: null, message: 'Case not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
 
// index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { findIndianKanoonUrlFromGoogle } from './googleSearch';
import { searchIndianKanoonWithCSE } from './googleCustomSearch';
import { searchIndianKanoon } from './indianKanoonApi';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
app.post('/case-search', async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Missing title in request body' });
  }

  const result = await searchIndianKanoon(title);

  res.json({
    title,
    url: result || 'not found',
  });
});
app.post('/api/google-case-search', async (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing title' });
  }

  const url = await searchIndianKanoonWithCSE(title);

  if (url) {
    return res.json({ url });
  } else {
    return res.status(404).json({ url: null, message: 'Indian Kanoon link not found' });
  }
}); 

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
*/
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { searchIndianKanoon } from './indianKanoonApi';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const IK_TOKEN = process.env.IK_TOKEN;

app.use(cors());
app.use(express.json());

app.post('/search', async (req: Request, res: Response) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "title" in request body' });
  }

  if (!IK_TOKEN) {
    return res.status(500).json({ error: 'Server missing IK_TOKEN' });
  }

  try {
    const searchResult = await searchIndianKanoon(title, IK_TOKEN);
    return res.json(searchResult);
  } catch (error: any) {
    console.error('[Search Error]', error.message);
    return res.status(500).json({ error: 'Search failed', details: error.message });
  }
});
app.post('/find', async (req, res) => {
  // Extract the search query from the request body
  const searchQuery = req.body.title;
  const apiToken = process.env.IK_TOKEN;

  if (!searchQuery) {
    return res.status(400).json({ error: 'Search query (title) is required.' });
  }

  if (!apiToken) {
    return res.status(500).json({ 
      error: 'Server configuration error',
      details: 'IK_TOKEN environment variable is not set' 
    });
  }

  console.log(`[Server] Received search query: "${searchQuery}"`);
  console.log(`[Server] Using token: ${apiToken ? '****' + apiToken.slice(-4) : 'Not set'}`);

  try {
    // Use the Node.js implementation instead of Python
    const searchResult = await searchIndianKanoon(searchQuery, apiToken);
    console.log('[Server] Successfully completed search.');
    res.status(200).json(searchResult);
  } catch (error: any) {
    console.error('[Server] Search failed:', error);
    res.status(500).json({
      error: 'Search failed.',
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
