# Indian Kanoon Case Search API

A comprehensive Node.js/TypeScript API service that provides multiple methods to search for Indian legal cases and retrieve their URLs from the Indian Kanoon database. The service integrates with various search engines and AI models to provide accurate case lookup functionality.

## 🚀 Features

- **Multiple Search Methods**: 
  - LLM-powered search using OpenAI GPT-4
  - Google Custom Search Engine integration
  - SerpAPI Google search integration
  - Direct Indian Kanoon API integration
  - Python-based advanced search with fuzzy matching

- **Intelligent Fallback System**: Automatically tries different search methods if one fails
- **Fuzzy Matching**: Uses difflib for intelligent case title matching
- **RESTful API**: Clean and simple HTTP endpoints
- **TypeScript Support**: Full type safety and modern JavaScript features
- **Cloud Ready**: Optimized for deployment on Google Cloud Run

## 📋 Prerequisites

- Node.js 22 or higher
- Python 3.7 or higher
- npm or yarn package manager
- Google Cloud Platform account (for deployment)
- Firebase CLI (for deployment)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd search_url_searching/test2
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Required API Keys
   IK_TOKEN=your_indian_kanoon_api_token
   GEMINI_API_KEY=your_gemini_api_key
   SERPAPI_API_KEY=your_serpapi_key
   GOOGLE_API_KEY=your_google_custom_search_api_key
   SEARCH_ENGINE_ID=your_google_custom_search_engine_id
   
   # Optional
   PORT=3001
   ```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run start
```

### Production Mode
```bash
npm run build
node dist/index.js
```

The server will start on `http://localhost:3001` (or the port specified in your environment variables).

## 📚 API Endpoints

### 1. Search Endpoint
**POST** `/search`

Searches for a case using the Python-based advanced search with fuzzy matching.

**Request Body:**
```json
{
  "title": "K.M. Nanavati v. State of Maharashtra"
}
```

**Response:**
```json
{
  "input": "K.M. Nanavati v. State of Maharashtra",
  "best_match": {
    "title": "K.M. Nanavati v. State of Maharashtra",
    "url": "https://indiankanoon.org/doc/1596139/"
  },
  "top_results": [
    {
      "title": "K.M. Nanavati v. State of Maharashtra",
      "url": "https://indiankanoon.org/doc/1596139/"
    }
  ]
}
```

### 2. Find Endpoint
**POST** `/find`

Alternative search endpoint with enhanced error handling and logging.

**Request Body:**
```json
{
  "title": "Case title here"
}
```

**Response:**
```json
{
  "input": "Case title here",
  "best_match": {
    "title": "Exact case title from database",
    "url": "https://indiankanoon.org/doc/123456/"
  },
  "top_results": [...]
}
```

## 🔍 Search Methods

### 1. LLM Search (`llmSearch.ts`)
- Uses OpenAI GPT-4 to intelligently search for cases
- Provides direct Indian Kanoon URLs
- High accuracy for well-known cases

### 2. Google Search (`googleSearch.ts`)
- Uses SerpAPI to search Google for Indian Kanoon results
- Searches specifically within `indiankanoon.org` domain
- Good for finding cases with partial information

### 3. Google Custom Search (`googleCustomSearch.ts`)
- Uses Google Custom Search Engine API
- Configured to search Indian Kanoon specifically
- Reliable and fast results

### 4. Indian Kanoon API (`indianKanoonApi.ts`)
- Direct integration with Indian Kanoon's official API
- Multiple query variations for better matching
- Handles case title variations (vs, v., etc.)

### 5. Python Advanced Search (`ikapi_modified_search.py`)
- Uses the official Indian Kanoon Python API
- Implements fuzzy matching with difflib
- Provides best match and top results
- Most comprehensive search method

## 🏗️ Project Structure

```
├── dist/                    # Compiled JavaScript files
├── node_modules/           # Node.js dependencies
├── output/                 # Output directory for logs
├── src/                    # Source TypeScript files
│   ├── index.ts           # Main server file
│   ├── googleSearch.ts    # SerpAPI Google search
│   ├── googleCustomSearch.ts # Google CSE search
│   ├── indianKanoonApi.ts # Direct IK API integration
│   └── llmSearch.ts       # OpenAI LLM search
├── ikapi.py               # Indian Kanoon Python API
├── ikapi_modified_search.py # Modified Python search script
├── package.json           # Node.js dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This documentation
```

## 🚀 Deployment to Google Cloud Run with Firebase

### Prerequisites for Deployment

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project**
   ```bash
   firebase init functions
   ```

### Step 1: Configure Firebase Functions

1. **Update `package.json`** (already configured):
   ```json
   {
     "name": "functions",
     "engines": {
       "node": "22"
     },
     "main": "index.js",
     "scripts": {
       "build": "tsc",
       "deploy": "firebase deploy --only functions"
     }
   }
   ```

2. **Create `firebase.json`** in the root directory:
   ```json
   {
     "functions": {
       "source": ".",
       "runtime": "nodejs22",
       "predeploy": ["npm run build"]
     }
   }
   ```

### Step 2: Configure for Cloud Run

1. **Create `Dockerfile`**:
   ```dockerfile
   FROM node:22-slim

   # Install Python and pip
   RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

   # Set working directory
   WORKDIR /app

   # Copy package files
   COPY package*.json ./

   # Install Node.js dependencies
   RUN npm ci --only=production

   # Copy Python files
   COPY *.py ./

   # Install Python dependencies
   RUN pip3 install --no-cache-dir -r requirements.txt

   # Copy TypeScript source
   COPY *.ts ./
   COPY tsconfig.json ./

   # Build TypeScript
   RUN npm run build

   # Expose port
   EXPOSE 8080

   # Set environment variables
   ENV PORT=8080

   # Start the application
   CMD ["node", "dist/index.js"]
   ```

2. **Create `requirements.txt`**:
   ```
   requests>=2.25.0
   ```

3. **Create `.dockerignore`**:
   ```
   node_modules
   npm-debug.log
   .git
   .gitignore
   README.md
   .env
   .env.local
   .env.development.local
   .env.test.local
   .env.production.local
   ```

### Step 3: Deploy to Cloud Run

1. **Build and push to Google Container Registry**:
   ```bash
   # Set your project ID
   export PROJECT_ID=your-gcp-project-id
   
   # Build the container
   gcloud builds submit --tag gcr.io/$PROJECT_ID/indian-kanoon-search
   
   # Deploy to Cloud Run
   gcloud run deploy indian-kanoon-search \
     --image gcr.io/$PROJECT_ID/indian-kanoon-search \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="IK_TOKEN=your_token,GEMINI_API_KEY=your_key,SERPAPI_API_KEY=your_key,GOOGLE_API_KEY=your_key,SEARCH_ENGINE_ID=your_id"
   ```

### Step 4: Alternative Firebase Functions Deployment

1. **Convert to Firebase Functions format**:
   Create `functions/index.ts`:
   ```typescript
   import * as functions from 'firebase-functions';
   import express from 'express';
   import cors from 'cors';
   import { exec, spawn } from 'child_process';

   const app = express();
   app.use(cors());
   app.use(express.json());

   // Your existing endpoints here...

   export const api = functions.https.onRequest(app);
   ```

2. **Deploy**:
   ```bash
   firebase deploy --only functions
   ```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `IK_TOKEN` | Indian Kanoon API token | Yes |
| `GEMINI_API_KEY` | Google Gemini API key for LLM search | Yes |
| `SERPAPI_API_KEY` | SerpAPI key for Google search | Yes |
| `GOOGLE_API_KEY` | Google Custom Search API key | Yes |
| `SEARCH_ENGINE_ID` | Google Custom Search Engine ID | Yes |
| `PORT` | Server port (default: 3001) | No |

## 🧪 Testing

### Test the API locally:
```bash
# Start the server
npm run start

# Test search endpoint
curl -X POST http://localhost:3001/search \
  -H "Content-Type: application/json" \
  -d '{"title": "K.M. Nanavati v. State of Maharashtra"}'

# Test find endpoint
curl -X POST http://localhost:3001/find \
  -H "Content-Type: application/json" \
  -d '{"title": "K.M. Nanavati v. State of Maharashtra"}'
```

## 📊 Performance Considerations

- **Caching**: Consider implementing Redis caching for frequently searched cases
- **Rate Limiting**: Implement rate limiting to prevent API abuse
- **Monitoring**: Set up Cloud Monitoring for production deployments
- **Scaling**: Cloud Run automatically scales based on traffic

## 🛠️ Development

### Available Scripts

- `npm run start` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run deploy` - Deploy to Firebase Functions
- `npm run lint` - Run ESLint

### Adding New Search Methods

1. Create a new TypeScript file in the root directory
2. Export a function that takes a title string and returns a URL or null
3. Import and use it in `index.ts`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation for Indian Kanoon
- Review the Google Cloud Run documentation

## 🔗 Useful Links

- [Indian Kanoon API Documentation](https://api.indiankanoon.org/)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [SerpAPI Documentation](https://serpapi.com/)

---

**Note**: Make sure to keep your API keys secure and never commit them to version control. Use environment variables or a secure key management system for production deployments.
