import type { AIModel, FilterState } from './types';

export function filterModels(models: AIModel[], filters: FilterState): AIModel[] {
  return models.filter(model => {
    // Task type filter
    if (filters.taskType && filters.taskType !== 'any') {
      if (!model.capabilities.includes(filters.taskType.toLowerCase())) return false;
    }

    // Budget filter
    if (filters.budget && filters.budget !== 'any') {
      const avgPrice = (model.pricing.input + model.pricing.output) / 2;
      switch (filters.budget) {
        case 'free': if (avgPrice > 0) return false; break;
        case 'cheap': if (avgPrice > 2) return false; break;
        case 'mid': if (avgPrice > 15) return false; break;
        // 'premium' — no filter
      }
    }

    // Context size filter
    if (filters.contextSize && filters.contextSize !== 'any') {
      switch (filters.contextSize) {
        case 'small': if (model.contextWindow > 32000) return false; break;
        case 'medium': if (model.contextWindow < 32000 || model.contextWindow > 200000) return false; break;
        case 'large': if (model.contextWindow < 200000) return false; break;
      }
    }

    // Privacy filter
    if (filters.privacy && filters.privacy !== 'any') {
      switch (filters.privacy) {
        case 'open-source': if (!model.openSource) return false; break;
        case 'local': if (!model.availability.includes('local')) return false; break;
      }
    }

    return true;
  });
}

export function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(0)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`;
  return String(tokens);
}

export function formatPrice(price: number): string {
  if (price === 0) return 'Free';
  if (price < 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(0)}`;
}

export function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    Anthropic: '#c084fc',
    OpenAI: '#22d3ee',
    Google: '#4ade80',
    Meta: '#60a5fa',
    Mistral: '#fb923c',
    DeepSeek: '#f472b6',
    xAI: '#e4e4e7',
    Alibaba: '#fbbf24',
    Microsoft: '#38bdf8',
  };
  return colors[provider] || '#a1a1aa';
}

export function capabilityIcon(cap: string): string {
  const icons: Record<string, string> = {
    text: '📝',
    code: '⌨️',
    vision: '👁️',
    audio: '🎵',
    video: '🎥',
    multimodal: '🌐',
    reasoning: '🧠',
    function_calling: '⚡',
    analysis: '📊',
  };
  return icons[cap] || '•';
}
