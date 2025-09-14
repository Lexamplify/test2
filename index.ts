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

app.post('/find', async (req: Request, res: Response) => {
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

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// For Vercel, export the app as default
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}