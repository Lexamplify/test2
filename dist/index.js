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
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { exec, spawn } from 'child_process';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
const PYTHON_SCRIPT = 'ikapi_modified_search.py';
const IK_TOKEN = process.env.IK_TOKEN;
app.use(cors());
app.use(express.json());
app.post('/search', (req, res) => {
    const { title } = req.body;
    if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "title" in request body' });
    }
    if (!IK_TOKEN) {
        return res.status(500).json({ error: 'Server missing IK_TOKEN' });
    }
    const command = `python ${PYTHON_SCRIPT} "${title}" "${IK_TOKEN}"`;
    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.error('[Python Script Error]', stderr);
            return res.status(500).json({ error: 'Python script execution failed' });
        }
        try {
            const data = JSON.parse(stdout);
            return res.json(data);
        }
        catch (parseError) {
            console.error('[Response Parsing Error]', parseError.message);
            return res.status(500).json({ error: 'Failed to parse Python script output' });
        }
    });
});
app.post('/find', (req, res) => {
    // Extract the search query from the request body
    const searchQuery = req.body.title;
    const apiToken = process.env.IK_TOKEN; // Changed from IK_API_TOKEN to IK_TOKEN to match your .env
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
    // Spawn the Python script with proper argument handling
    const args = [
        'ikapi_modified_search.py',
        `"${searchQuery.replace(/"/g, '\\"')}"`, // Escape quotes in search query
        `"${apiToken}"`
    ];
    console.log(`[Server] Executing: python ${args.join(' ')}`);
    const pythonProcess = spawn('python', args, {
        shell: true, // Use shell to handle complex arguments
        stdio: ['pipe', 'pipe', 'pipe']
    });
    let resultData = '';
    let errorData = '';
    // Listen for data from the script's standard outputsds
    pythonProcess.stdout.on('data', (data) => {
        resultData += data.toString();
    });
    // Listen for data from the script's standard error
    pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
        console.error(`[Python Script Error] stderr: ${data}`);
    });
    // Handle the script's exit event
    pythonProcess.on('close', (code) => {
        console.log(`[Server] Python script exited with code ${code}`);
        // If the script exited with an error code and we have error data
        if (code !== 0) {
            return res.status(500).json({
                error: 'Python script execution failed.',
                details: errorData,
            });
        }
        // If the script succeeded, try to parse its JSON output
        try {
            const searchResult = JSON.parse(resultData);
            console.log('[Server] Successfully parsed Python script output.');
            res.status(200).json(searchResult);
        }
        catch (parseError) {
            console.error('[Server] Failed to parse JSON from Python script:', parseError);
            res.status(500).json({
                error: 'Failed to parse script output.',
                rawData: resultData,
            });
        }
    });
});
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
