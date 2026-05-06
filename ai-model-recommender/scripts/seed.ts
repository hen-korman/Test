import { seedModels, isDbSeeded } from '../lib/db';
import modelsData from '../data/models.json';
import type { AIModel } from '../lib/types';

function main() {
  if (isDbSeeded()) {
    console.log('✓ Database already seeded');
    return;
  }
  console.log('Seeding database with model data...');
  seedModels(modelsData as AIModel[]);
  console.log(`✓ Seeded ${modelsData.length} models`);
}

main();
