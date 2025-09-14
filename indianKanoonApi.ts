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

  async search(query: string, pageNum: number = 0, maxPages: number = 1): Promise<IKSearchResponse> {
    const encodedQuery = encodeURIComponent(query);
    const endpoint = `/search/?formInput=${encodedQuery}&pagenum=${pageNum}&maxpages=${maxPages}`;
    
    try {
      const result = await this.callAPI(endpoint);
      return JSON.parse(result);
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  findClosestMatch(inputTitle: string, titles: string[]): string | null {
    if (titles.length === 0) return null;
    
    // Simple string similarity using Levenshtein distance
    let bestMatch = titles[0];
    let bestScore = this.calculateSimilarity(inputTitle.toLowerCase(), titles[0].toLowerCase());
    
    for (let i = 1; i < titles.length; i++) {
      const score = this.calculateSimilarity(inputTitle.toLowerCase(), titles[i].toLowerCase());
      if (score > bestScore) {
        bestScore = score;
        bestMatch = titles[i];
      }
    }
    
    return bestMatch;
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
      const searchResults = await this.search(query, 0, 1);
      
      if (!searchResults.docs || searchResults.docs.length === 0) {
        return {
          input: query,
          best_match: { title: '', url: '' },
          top_results: []
        };
      }

      const topDocs = searchResults.docs.slice(0, 5);
      const titles = topDocs.map(doc => doc.title);
      const bestTitle = this.findClosestMatch(query, titles);
      
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