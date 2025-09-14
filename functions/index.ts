import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { searchIndianKanoon } from '../indianKanoonApi';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/search', async (req: any, res: any) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "title" in request body' });
  }

  const IK_TOKEN = functions.config().indiankanoon?.token || process.env.IK_TOKEN;
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

app.post('/find', async (req: any, res: any) => {
  const searchQuery = req.body.title;
  const apiToken = functions.config().indiankanoon?.token || process.env.IK_TOKEN;

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

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);
