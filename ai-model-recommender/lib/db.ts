import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { AIModel } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'models.db');

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_logo TEXT,
      version TEXT,
      release_date TEXT,
      capabilities TEXT,
      context_window INTEGER,
      max_output INTEGER,
      pricing_input REAL,
      pricing_output REAL,
      pricing_currency TEXT DEFAULT 'USD',
      pricing_per TEXT DEFAULT 'M_tokens',
      strengths TEXT,
      weaknesses TEXT,
      benchmarks TEXT,
      availability TEXT,
      open_source INTEGER DEFAULT 0,
      last_updated TEXT
    );

    CREATE TABLE IF NOT EXISTS recommendation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task TEXT NOT NULL,
      filters TEXT,
      recommendations TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

export function seedModels(models: AIModel[]) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO models (
      id, name, provider, provider_logo, version, release_date,
      capabilities, context_window, max_output,
      pricing_input, pricing_output, pricing_currency, pricing_per,
      strengths, weaknesses, benchmarks, availability, open_source, last_updated
    ) VALUES (
      @id, @name, @provider, @providerLogo, @version, @releaseDate,
      @capabilities, @contextWindow, @maxOutput,
      @pricingInput, @pricingOutput, @pricingCurrency, @pricingPer,
      @strengths, @weaknesses, @benchmarks, @availability, @openSource, @lastUpdated
    )
  `);

  const seedMany = db.transaction((models: AIModel[]) => {
    for (const m of models) {
      insert.run({
        id: m.id,
        name: m.name,
        provider: m.provider,
        providerLogo: m.providerLogo,
        version: m.version,
        releaseDate: m.releaseDate,
        capabilities: JSON.stringify(m.capabilities),
        contextWindow: m.contextWindow,
        maxOutput: m.maxOutput,
        pricingInput: m.pricing.input,
        pricingOutput: m.pricing.output,
        pricingCurrency: m.pricing.currency,
        pricingPer: m.pricing.per,
        strengths: JSON.stringify(m.strengths),
        weaknesses: JSON.stringify(m.weaknesses),
        benchmarks: JSON.stringify(m.benchmarks),
        availability: JSON.stringify(m.availability),
        openSource: m.openSource ? 1 : 0,
        lastUpdated: m.lastUpdated,
      });
    }
  });

  seedMany(models);
}

export function getAllModels(): AIModel[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM models ORDER BY provider, name').all() as Record<string, unknown>[];
  return rows.map(rowToModel);
}

export function getModelById(id: string): AIModel | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM models WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? rowToModel(row) : undefined;
}

export function logRecommendation(task: string, filters: object, recommendations: object[]) {
  const db = getDb();
  db.prepare(`
    INSERT INTO recommendation_logs (task, filters, recommendations)
    VALUES (?, ?, ?)
  `).run(task, JSON.stringify(filters), JSON.stringify(recommendations));
}

function rowToModel(row: Record<string, unknown>): AIModel {
  return {
    id: row.id as string,
    name: row.name as string,
    provider: row.provider as string,
    providerLogo: row.provider_logo as string,
    version: row.version as string,
    releaseDate: row.release_date as string,
    capabilities: JSON.parse(row.capabilities as string),
    contextWindow: row.context_window as number,
    maxOutput: row.max_output as number,
    pricing: {
      input: row.pricing_input as number,
      output: row.pricing_output as number,
      currency: row.pricing_currency as 'USD',
      per: row.pricing_per as 'M_tokens',
    },
    strengths: JSON.parse(row.strengths as string),
    weaknesses: JSON.parse(row.weaknesses as string),
    benchmarks: JSON.parse(row.benchmarks as string),
    availability: JSON.parse(row.availability as string),
    openSource: Boolean(row.open_source),
    lastUpdated: row.last_updated as string,
  };
}

export function isDbSeeded(): boolean {
  try {
    if (!fs.existsSync(DB_PATH)) return false;
    const db = getDb();
    const count = db.prepare('SELECT COUNT(*) as cnt FROM models').get() as { cnt: number };
    return count.cnt > 0;
  } catch {
    return false;
  }
}
