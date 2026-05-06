import { NextRequest, NextResponse } from 'next/server';
import { getRecommendations } from '@/lib/claude';
import { getAllModels, isDbSeeded, seedModels, logRecommendation } from '@/lib/db';
import { filterModels } from '@/lib/recommender';
import modelsData from '@/data/models.json';
import type { AIModel, FilterState } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task, filters } = body as { task: string; filters: FilterState };

    if (!task || task.trim().length < 3) {
      return NextResponse.json({ error: 'Task description is too short' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    let models: AIModel[];
    try {
      if (!isDbSeeded()) {
        seedModels(modelsData as AIModel[]);
      }
      models = getAllModels();
    } catch {
      models = modelsData as AIModel[];
    }

    const filteredModels = filterModels(models, filters || {});
    const candidateModels = filteredModels.length >= 3 ? filteredModels : models;

    const result = await getRecommendations(task, filters || {}, candidateModels);

    // Enrich recommendations with full model data
    const enriched = result.recommendations.map(rec => ({
      ...rec,
      model: models.find(m => m.id === rec.modelId),
    }));

    try {
      logRecommendation(task, filters || {}, enriched);
    } catch {
      // Non-critical: log failure silently
    }

    return NextResponse.json({ recommendations: enriched, taskSummary: result.taskSummary });
  } catch (error) {
    console.error('Recommend API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
