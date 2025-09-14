import axios from 'axios';

interface IKSearchResult {
  input: string;
  best_match: {
    title: string;
    url: string;
  };
  top_results: Array<{
    title: string;
    url: string;
  }>;
}

interface IKDoc {
  tid: number;
  title: string;
  publishdate: string;
  docsource: string;
}

interface IKSearchResponse {
  docs: IKDoc[];
  found: number;
  errmsg?: string;
}

export class IndianKanoonAPI {
  private baseUrl = 'https://api.indiankanoon.org';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async callAPI(endpoint: string): Promise<string> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Token ${this.token}`,
      'Accept': 'application/json'
    };

    try {
      const response = await axios.post(url, {}, { headers });
      return response.data;
    } catch (error: any) {
      console.error('API call failed:', error.message);
      throw new Error(`API call failed: ${error.message}`);
    }
  }

  async search(query: string, pageNum: number = 0, maxPages: number = 5): Promise<IKSearchResponse> {
    const encodedQuery = encodeURIComponent(query);
    const endpoint = `/search/?formInput=${encodedQuery}&pagenum=${pageNum}&maxpages=${maxPages}`;
    
    console.log(`[IK API] Searching for: "${query}"`);
    console.log(`[IK API] Endpoint: ${endpoint}`);
    
    try {
      const result = await this.callAPI(endpoint);
      console.log(`[IK API] Raw result type:`, typeof result);
      console.log(`[IK API] Raw result:`, typeof result === 'string' ? result.substring(0, 500) + '...' : result);
      
      // Handle both string and object responses
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;
      console.log(`[IK API] Parsed result docs count:`, parsed.docs?.length || 0);
      return parsed;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  findClosestMatch(inputTitle: string, titles: string[]): string | null {
    if (titles.length === 0) return null;
    
    // Use difflib-like matching similar to Python's get_close_matches
    const matches = this.getCloseMatches(inputTitle, titles, 1, 0.6);
    return matches.length > 0 ? matches[0] : titles[0];
  }

  // Implementation similar to Python's difflib.get_close_matches
  private getCloseMatches(word: string, possibilities: string[], n: number = 3, cutoff: number = 0.6): string[] {
    if (!word || possibilities.length === 0) return [];
    
    const matches: Array<{ word: string; ratio: number }> = [];
    
    for (const possibility of possibilities) {
      const ratio = this.sequenceMatcher(word, possibility);
      if (ratio >= cutoff) {
        matches.push({ word: possibility, ratio });
      }
    }
    
    // Sort by ratio (descending) and return top n
    return matches
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, n)
      .map(match => match.word);
  }

  // Sequence matcher similar to Python's difflib.SequenceMatcher
  private sequenceMatcher(a: string, b: string): number {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    if (aLower === bLower) return 1.0;
    if (aLower.length === 0 || bLower.length === 0) return 0.0;
    
    const matches = this.countMatches(aLower, bLower);
    return (2.0 * matches) / (aLower.length + bLower.length);
  }

  private countMatches(a: string, b: string): number {
    const aWords = a.split(/\s+/);
    const bWords = b.split(/\s+/);
    
    let matches = 0;
    const used = new Set<number>();
    
    for (const aWord of aWords) {
      for (let i = 0; i < bWords.length; i++) {
        if (used.has(i)) continue;
        
        if (this.wordsSimilar(aWord, bWords[i])) {
          matches++;
          used.add(i);
          break;
        }
      }
    }
    
    return matches;
  }

  private wordsSimilar(word1: string, word2: string): boolean {
    if (word1 === word2) return true;
    if (Math.abs(word1.length - word2.length) > 2) return false;
    
    const similarity = this.calculateSimilarity(word1, word2);
    return similarity > 0.8;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  async searchWithBestMatch(query: string): Promise<IKSearchResult> {
    try {
      // Match Python: ik.search(title, 0, 5)
      const searchResults = await this.search(query, 0, 5);
      
      if (!searchResults.docs || searchResults.docs.length === 0) {
        return {
          input: query,
          best_match: { title: '', url: '' },
          top_results: []
        };
      }

      // Match Python: top_docs = results['docs'][:5]
      const topDocs = searchResults.docs.slice(0, 5);
      const titles = topDocs.map(doc => doc.title);
      
      // Match Python: difflib.get_close_matches(title, titles, n=1)
      const bestTitle = this.findClosestMatch(query, titles);
      
      // Match Python: best_doc = next((doc for doc in top_docs if doc['title'] == best_title[0]), top_docs[0]) if best_title else top_docs[0]
      const bestDoc = bestTitle 
        ? topDocs.find(doc => doc.title === bestTitle) || topDocs[0]
        : topDocs[0];

      const result: IKSearchResult = {
        input: query,
        best_match: {
          title: bestDoc.title,
          url: `https://indiankanoon.org/doc/${bestDoc.tid}/`
        },
        top_results: topDocs.map(doc => ({
          title: doc.title,
          url: `https://indiankanoon.org/doc/${doc.tid}/`
        }))
      };

      return result;
    } catch (error) {
      console.error('Search with best match failed:', error);
      return {
        input: query,
        best_match: { title: '', url: '' },
        top_results: []
      };
    }
  }
}

export async function searchIndianKanoon(query: string, token: string): Promise<IKSearchResult> {
  const api = new IndianKanoonAPI(token);
  return await api.searchWithBestMatch(query);
}