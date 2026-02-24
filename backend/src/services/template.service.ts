import { SavedTemplate, CriteriaGroup } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../middleware/logger';

const TEMPLATES_FILE = path.join(__dirname, '../../data/templates.json');

export class TemplateService {
  private templates: SavedTemplate[] = [];

  constructor() {
    this.loadTemplates();
  }

  private ensureDataDir(): void {
    const dir = path.dirname(TEMPLATES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadTemplates(): void {
    try {
      this.ensureDataDir();
      if (fs.existsSync(TEMPLATES_FILE)) {
        const data = fs.readFileSync(TEMPLATES_FILE, 'utf-8');
        this.templates = JSON.parse(data);
      }
    } catch (error: any) {
      logger.warn('Could not load templates, starting fresh', { error: error.message });
      this.templates = [];
    }
  }

  private saveTemplates(): void {
    try {
      this.ensureDataDir();
      fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(this.templates, null, 2));
    } catch (error: any) {
      logger.error('Failed to save templates', { error: error.message });
      throw new Error('Failed to save template');
    }
  }

  getAll(): SavedTemplate[] {
    return this.templates;
  }

  getById(id: string): SavedTemplate | undefined {
    return this.templates.find((t) => t.id === id);
  }

  create(name: string, description: string, criteriaGroup: CriteriaGroup): SavedTemplate {
    const template: SavedTemplate = {
      id: `tmpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      description,
      criteriaGroup,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.push(template);
    this.saveTemplates();
    return template;
  }

  update(id: string, updates: Partial<Pick<SavedTemplate, 'name' | 'description' | 'criteriaGroup'>>): SavedTemplate {
    const index = this.templates.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Template not found');

    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveTemplates();
    return this.templates[index];
  }

  delete(id: string): void {
    const index = this.templates.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Template not found');

    this.templates.splice(index, 1);
    this.saveTemplates();
  }
}
