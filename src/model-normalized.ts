// ─── Interface Spec — Normalized & Validation Types ─────────────────────────
// Post-normalization types used by the renderer, plus validation diagnostics.
// Imported by index.ts and re-exported alongside root model types.

import type { SpecInfo, Operation } from "./model.ts";

// ─── Validation ──────────────────────────────────────────────────────────────

export type IssueSeverity = "error" | "warning";

export interface ValidationIssue {
  severity: IssueSeverity;
  path: string;
  message: string;
}

// ─── Normalized Spec ─────────────────────────────────────────────────────────

export interface NormalizedSpec {
  info: SpecInfo;
  operations: NormalizedOperation[];
}

export interface NormalizedOperation {
  id: string;
  title: string;
  summary?: string;
  description?: string;
  interfaceType: string;
  transport: string;
  pattern: string;
  tags: string[];
  address?: NormalizedAddress;
  metaRows: KeyValueRow[];
  bindingRows: KeyValueRow[];
  deliveryRows: KeyValueRow[];
  retryRows: KeyValueRow[];
  genericTables: NormalizedGenericTable[];
  parameterTables: NormalizedFieldTable[];
  messageTables: NormalizedFieldTable[];
  responseRows: NormalizedResponseRow[];
  errorRows: NormalizedErrorRow[];
  examples: NormalizedExample[];
}

export interface NormalizedAddress {
  kind: string;
  value: string;
  method?: string;
  label: string;
}

export interface KeyValueRow {
  key: string;
  value: string;
  code?: boolean;
}

export interface NormalizedGenericTable {
  title: string;
  columns: NormalizedGenericColumn[];
  rows: Record<string, string>[];
}

export interface NormalizedGenericColumn {
  key: string;
  label: string;
  code?: boolean;
}

export interface NormalizedFieldTable {
  title: string;
  rows: NormalizedFieldRow[];
}

export interface NormalizedFieldRow {
  path: string;
  type: string;
  required: boolean;
  example?: string;
  description?: string;
  enumValues?: string;
  unit?: string;
  deprecated?: boolean;
  depth: number;
}

export interface NormalizedResponseRow {
  status: string;
  schema?: string;
  contentType?: string;
  description?: string;
}

export interface NormalizedErrorRow {
  code: string;
  status?: string;
  retryable?: boolean;
  description: string;
}

export interface NormalizedExample {
  title: string;
  role?: string;
  value: string;
}

// ─── Render Options ──────────────────────────────────────────────────────────

export interface RenderOptions {
  fullPage?: boolean;
  inlineCss?: boolean;
  cssText?: string;
  title?: string;
  lang?: string;
  operation?: string;
  idPrefix?: string;
  includeOperations?: string[];
  include?: Partial<
    Pick<Operation, "transport" | "interfaceType" | "pattern">
  > & {
    tags?: string[];
  };
}
