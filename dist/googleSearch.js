// googleSearch.ts
import { getJson } from 'serpapi';
// You'll need to sign up for a free API key at https://serpapi.com/
// Then set it as an environment variable: SERPAPI_API_KEY=your_api_key_here
const API_KEY = process.env.SERPAPI_API_KEY || '';
if (!API_KEY) {
    console.warn('Warning: SERPAPI_API_KEY environment variable is not set. Please set it to use Google search functionality.');
}
export async function findIndianKanoonUrlFromGoogle(title) {
    if (!API_KEY) {
        console.error('SERPAPI_API_KEY is not set. Please set it to use Google search functionality.');
        return null;
    }
    try {
        console.log('Searching Google for:', title);
        // Construct the query to search for Indian Kanoon documents
        const query = `${title} site:indiankanoon.org`;
        console.log('Search query:', query);
        // Make the API request to SerpAPI
        const results = await getJson({
            engine: 'google',
            api_key: API_KEY,
            q: query,
            location: 'India',
            hl: 'en',
            num: 5, // Get top 5 results
            google_domain: 'google.co.in'
        });
        console.log('Search results:', JSON.stringify(results.organic_results, null, 2));
        // Check if we got any results
        if (!results.organic_results || results.organic_results.length === 0) {
            console.log('No results found');
            return null;
        }
        // Return the first result's link
        const firstResult = results.organic_results[0];
        if (firstResult && firstResult.link) {
            console.log('Found result:', firstResult.link);
            return firstResult.link;
        }
        return null;
    }
    catch (error) {
        console.error('Google search failed:');
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            if ('stack' in error) {
                console.error('Stack trace:', error.stack);
            }
        }
        else {
            console.error('Unknown error:', error);
        }
        return null;
    }
}
