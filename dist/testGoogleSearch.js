import { findIndianKanoonUrlFromGoogle } from './googleSearch.js';
async function testGoogleSearch() {
    // Check if API key is set
    if (!process.env.SERPAPI_API_KEY) {
        console.error('❌ Error: SERPAPI_API_KEY environment variable is not set.');
        console.log('\nTo run this test, please follow these steps:');
        console.log('1. Sign up for a free API key at https://serpapi.com/');
        console.log('2. Set the API key as an environment variable:');
        console.log('   - On Windows: set SERPAPI_API_KEY=your_api_key_here');
        console.log('   - On macOS/Linux: export SERPAPI_API_KEY=your_api_key_here');
        console.log('3. Run the test again');
        return;
    }
    try {
        const testQueries = [
            'Indian Penal Code Section 302',
            'Constitution of India Article 21',
            'Code of Criminal Procedure Section 41'
        ];
        for (const query of testQueries) {
            console.log('\n' + '='.repeat(80));
            console.log(`Testing query: "${query}"`);
            console.log('='.repeat(80));
            const result = await findIndianKanoonUrlFromGoogle(query);
            if (result) {
                console.log('✅ Success! Found URL:', result);
            }
            else {
                console.log('❌ No results found for query:', query);
            }
            // Add a small delay between queries to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    catch (error) {
        console.error('❌ Test failed with error:');
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            if ('stack' in error) {
                console.error('Stack trace:', error.stack);
            }
        }
        else {
            console.error('Unknown error:', error);
        }
    }
}
testGoogleSearch();
