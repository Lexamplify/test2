"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const child_process_1 = require("child_process");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post('/search', (req, res) => {
    var _a;
    const { title } = req.body;
    if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "title" in request body' });
    }
    const IK_TOKEN = (_a = functions.config().indiankanoon) === null || _a === void 0 ? void 0 : _a.token;
    if (!IK_TOKEN) {
        return res.status(500).json({ error: 'Server missing IK_TOKEN' });
    }
    const command = `python ikapi_modified_search.py "${title}" "${IK_TOKEN}"`;
    (0, child_process_1.exec)(command, (err, stdout, stderr) => {
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
    var _a;
    // Extract the search query from the request body
    const searchQuery = req.body.title;
    const apiToken = (_a = functions.config().indiankanoon) === null || _a === void 0 ? void 0 : _a.token;
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
    const pythonProcess = (0, child_process_1.spawn)('python', args, {
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
// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map