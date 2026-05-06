import { NextRequest, NextResponse } from 'next/server';
import { getWhyNotExplanation } from '@/lib/claude';
import type { FilterState } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task, excludedModel, recommendedModel, filters } = body as {
      task: string;
      excludedModel: string;
      recommendedModel: string;
      filters: FilterState;
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const explanation = await getWhyNotExplanation(task, excludedModel, recommendedModel, filters || {});
    return NextResponse.json({ explanation });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
