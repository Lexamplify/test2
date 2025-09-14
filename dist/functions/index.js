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
const dotenv_1 = __importDefault(require("dotenv"));
const indianKanoonApi_1 = require("../indianKanoonApi");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post('/search', async (req, res) => {
    const { title } = req.body;
    if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "title" in request body' });
    }
    const IK_TOKEN = functions.config().indiankanoon?.token || process.env.IK_TOKEN;
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
// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);
