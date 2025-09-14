import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import { exec, spawn } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/search', (req: any, res: any) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "title" in request body' });
  }

  const IK_TOKEN = functions.config().indiankanoon?.token || process.env.IK_TOKEN;
  if (!IK_TOKEN) {
    return res.status(500).json({ error: 'Server missing IK_TOKEN' });
  }

  const command = `python ikapi_modified_search.py "${title}" "${IK_TOKEN}"`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error('[Python Script Error]', stderr);
      return res.status(500).json({ error: 'Python script execution failed' });
    }

    try {
      const data = JSON.parse(stdout);
      return res.json(data);
    } catch (parseError: any) {
      console.error('[Response Parsing Error]', parseError.message);
      return res.status(500).json({ error: 'Failed to parse Python script output' });
    }
  });
});

app.post('/find', (req: any, res: any) => {
  // Extract the search query from the request body
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
  console.log(`[Server] Environment check: IK_TOKEN is ${process.env.IK_TOKEN ? 'set' : 'not set'}`);

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

  // Listen for data from the script's standard output
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
    } catch (parseError) {
      console.error('[Server] Failed to parse JSON from Python script:', parseError);
      res.status(500).json({
        error: 'Failed to parse script output.',
        rawData: resultData,
      });
    }
  });
});

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);
