export interface MessageTemplate {
  id: string;
  alertTypeId: string;
  templateBody: string;
  blocksJson: unknown[] | null;
  updatedAt: string;
}

export interface UpsertTemplateDto {
  templateBody: string;
  blocksJson?: unknown[] | null;
}
