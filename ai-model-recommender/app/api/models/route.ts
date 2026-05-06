import { NextResponse } from 'next/server';
import { getAllModels, isDbSeeded, seedModels } from '@/lib/db';
import modelsData from '@/data/models.json';
import type { AIModel } from '@/lib/types';

export async function GET() {
  try {
    if (!isDbSeeded()) {
      seedModels(modelsData as AIModel[]);
    }
    const models = getAllModels();
    return NextResponse.json({ models });
  } catch (error) {
    console.error('Models API error:', error);
    // Fallback to JSON file if DB fails
    return NextResponse.json({ models: modelsData });
  }
}
