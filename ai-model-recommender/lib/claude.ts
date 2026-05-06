import Anthropic from '@anthropic-ai/sdk';
import type { AIModel, FilterState, RecommendationResponse } from './types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert AI model recommender. Your job is to analyze a user's task and recommend the top 3 AI models from a provided database.

Rules:
- Prefer open-source models when user explicitly requests privacy or local deployment
- Prefer speed-optimized models when user prioritizes speed
- Prefer accuracy/quality when user wants best results regardless of cost
- Match context window requirements carefully
- Consider pricing tiers honestly
- Be biased toward the user's explicit priorities

You MUST respond with ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "modelId": "model-id-here",
      "matchScore": 95,
      "reasons": {
        "he": "סיבה בעברית מדוע המודל הזה מתאים למשימה",
        "en": "Reason in English why this model fits the task"
      },
      "tradeoffs": "Brief tradeoff description: what you give up by choosing this model"
    }
  ],
  "taskSummary": "One sentence summary of the detected task type"
}

matchScore should be 0-100 (integer). Return exactly 3 recommendations ordered by match score descending.`;

export async function getRecommendations(
  task: string,
  filters: FilterState,
  models: AIModel[]
): Promise<RecommendationResponse> {
  const modelsContext = JSON.stringify(
    models.map(m => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      capabilities: m.capabilities,
      contextWindow: m.contextWindow,
      pricing: m.pricing,
      strengths: m.strengths,
      weaknesses: m.weaknesses,
      benchmarks: m.benchmarks,
      openSource: m.openSource,
      availability: m.availability,
    })),
    null,
    0
  );

  const userMessage = `Task: ${task}

User preferences:
- Task type: ${filters.taskType || 'Any'}
- Budget: ${filters.budget || 'Any'}
- Context size needed: ${filters.contextSize || 'Any'}
- Privacy requirement: ${filters.privacy || 'Cloud OK'}
- Priority: ${filters.priority || 'Balance'}

Available models database:
${modelsContext}

Recommend the top 3 models for this task.`;

  const message = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid response from Claude');
  }

  return JSON.parse(jsonMatch[0]) as RecommendationResponse;
}

export async function getWhyNotExplanation(
  task: string,
  excludedModelName: string,
  recommendedModelName: string,
  filters: FilterState
): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `For the task: "${task}"

With these preferences:
- Task type: ${filters.taskType || 'Any'}
- Budget: ${filters.budget || 'Any'}
- Priority: ${filters.priority || 'Balance'}

Why was "${excludedModelName}" NOT recommended over "${recommendedModelName}"?

Answer in 2-3 sentences, be specific and honest about tradeoffs.`
    }],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}
