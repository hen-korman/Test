export interface AlertType {
  id: string;
  name: string;
  slug: string;
  payloadSchema: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
}

export interface CreateAlertTypeDto {
  name: string;
  slug: string;
  payloadSchema: Record<string, unknown>;
  createdBy: string;
}

export interface UpdateAlertTypeDto {
  name?: string;
  slug?: string;
  payloadSchema?: Record<string, unknown>;
}
