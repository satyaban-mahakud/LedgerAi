export type SourceType = 'manual' | 'paste' | 'image' | 'pdf' | 'csv';
export type VerificationStatus = 'pending_review' | 'verified';

export interface LineItem {
  description: string;
  quantity?: number | null;
  amount?: number | null;
}

export interface Receipt {
  id: string;
  amount: number;
  currency: string;
  vendor: string;
  category: string;
  date: string;
  taxAmount?: number | null;
  summary?: string | null;
  lineItems?: LineItem[];
  confidence: number;
  sourceType: SourceType;
  sourceName: string;
  createdAt: string;
  status: VerificationStatus;
  notes?: string;
  // External Integration Mapping
  sapStatus?: 'not_synced' | 'synced' | 'failed';
  sfStatus?: 'not_synced' | 'synced' | 'failed';
  erpStatus?: 'not_synced' | 'synced' | 'failed';
}

export interface ProcessingItem {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'uploading' | 'parsing' | 'structuring' | 'completed' | 'failed';
  error?: string;
  result?: {
    amount: number;
    currency: string;
    vendor: string;
    category: string;
    date: string;
    taxAmount?: number | null;
    summary?: string | null;
    lineItems?: LineItem[];
    confidence: number;
  };
}

export interface IntegrationConfig {
  sapUrl: string;
  sapCompanyCode: string;
  sapGlAccount: string;
  sfInstanceUrl: string;
  sfAccountId: string;
  erpEndpoint: string;
  erpTenantId: string;
}

export interface SharedInboxFile {
  id: string;
  name: string;
  size: string;
  type: 'image/png' | 'image/jpeg' | 'application/pdf';
  source: 'Slack Finance Channel' | 'Email Inbox' | 'Shared Drive Ingestion';
  receivedAt: string;
  parsed: boolean;
}
