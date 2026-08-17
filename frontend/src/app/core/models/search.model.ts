export type SearchResultType = 'person' | 'project' | 'task';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  url: string;
  avatar_url?: string | null;
  meta?: string | null;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
}
