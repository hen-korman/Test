/**
 * Auto-update script for AI model database.
 * Fetches from OpenRouter API and diffs against current local data.
 * Run via: npx tsx scripts/update-models.ts
 * Schedule: Vercel Cron at 3 AM daily
 */

import fs from 'fs';
import path from 'path';

const LOG_PATH = path.join(process.cwd(), 'logs', 'model-updates.log');
const DATA_PATH = path.join(process.cwd(), 'data', 'models.json');

function log(msg: string) {
  const entry = `[${new Date().toISOString()}] ${msg}`;
  console.log(entry);
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, entry + '\n');
}

async function fetchOpenRouterModels() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    log('WARN: OPENROUTER_API_KEY not set, skipping OpenRouter fetch');
    return [];
  }

  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    log(`ERROR: OpenRouter fetch failed: ${res.status}`);
    return [];
  }

  const data = await res.json() as { data: { id: string; name: string; context_length: number; pricing: { prompt: string; completion: string } }[] };
  return data.data || [];
}

async function main() {
  log('Starting model update check...');

  const currentModels = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8')) as { id: string }[];
  const currentIds = new Set(currentModels.map(m => m.id));

  const orModels = await fetchOpenRouterModels();
  const newModels = orModels.filter(m => !currentIds.has(m.id));

  if (newModels.length === 0) {
    log('No new models found. Database is up to date.');
  } else {
    log(`Found ${newModels.length} potentially new models:`);
    newModels.slice(0, 10).forEach(m => log(`  + ${m.id} (${m.name})`));
    log('Review data/models.json to add curated entries for these models.');
  }

  // Trigger Vercel revalidation if configured
  const revalidateUrl = process.env.VERCEL_REVALIDATE_URL;
  const revalidateToken = process.env.VERCEL_REVALIDATE_TOKEN;
  if (revalidateUrl && revalidateToken && newModels.length > 0) {
    try {
      const r = await fetch(revalidateUrl, {
        method: 'POST',
        headers: { 'x-revalidate-token': revalidateToken },
      });
      log(`Vercel revalidation: ${r.status}`);
    } catch (e) {
      log(`ERROR triggering revalidation: ${e}`);
    }
  }

  log('Update check complete.');
}

main().catch(e => {
  log(`FATAL: ${e}`);
  process.exit(1);
});
