export interface AIModel {
  id: string;
  name: string;
  provider: string;
  providerLogo: string;
  version: string;
  releaseDate: string;
  capabilities: string[];
  contextWindow: number;
  maxOutput: number;
  pricing: {
    input: number;
    output: number;
    currency: 'USD';
    per: 'M_tokens';
  };
  strengths: string[];
  weaknesses: string[];
  benchmarks: {
    mmlu?: number;
    humaneval?: number;
    gpqa?: number;
  };
  availability: ('api' | 'web' | 'local')[];
  openSource: boolean;
  lastUpdated: string;
}

export interface FilterState {
  taskType: string;
  budget: string;
  contextSize: string;
  privacy: string;
  priority: string;
}

export interface Recommendation {
  modelId: string;
  matchScore: number;
  reasons: {
    he: string;
    en: string;
  };
  tradeoffs: string;
  model?: AIModel;
}

export interface RecommendationResponse {
  recommendations: Recommendation[];
  taskSummary?: string;
}
