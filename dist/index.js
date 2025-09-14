"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const indianKanoonApi_1 = require("./indianKanoonApi");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const IK_TOKEN = process.env.IK_TOKEN;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post('/search', async (req, res) => {
    const { title } = req.body;
    if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "title" in request body' });
    }
    if (!IK_TOKEN) {
        return res.status(500).json({ error: 'Server missing IK_TOKEN' });
    }
    try {
        const searchResult = await (0, indianKanoonApi_1.searchIndianKanoon)(title, IK_TOKEN);
        return res.json(searchResult);
    }
    catch (error) {
        console.error('[Search Error]', error.message);
        return res.status(500).json({ error: 'Search failed', details: error.message });
    }
});
app.post('/find', async (req, res) => {
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
        const searchResult = await (0, indianKanoonApi_1.searchIndianKanoon)(searchQuery, apiToken);
        console.log('[Server] Successfully completed search.');
        res.status(200).json(searchResult);
    }
    catch (error) {
        console.error('[Server] Search failed:', error);
        res.status(500).json({
            error: 'Search failed.',
            details: error.message,
        });
    }
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
// For Vercel, export the app as default
exports.default = app;
// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
}
