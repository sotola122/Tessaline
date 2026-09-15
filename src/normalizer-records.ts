import type { KeyValueRow } from "./model-normalized.ts";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getRecordProperty(
  source: unknown,
  key: string,
): Record<string, unknown> | undefined {
  if (!isRecord(source)) return undefined;
  const value = source[key];
  return isRecord(value) ? value : undefined;
}

export function getRecordArrayProperty(
  source: unknown,
  key: string,
): Record<string, unknown>[] {
  if (!isRecord(source)) return [];
  const value = source[key];
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

export function getStringProperty(
  source: unknown,
  key: string,
): string | undefined {
  if (!isRecord(source)) return undefined;
  const value = source[key];
  return typeof value === "string" ? value : undefined;
}

export function getStringArrayProperty(source: unknown, key: string): string[] {
  if (!isRecord(source)) return [];
  const value = source[key];
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

export function flattenValueRows(
  value: unknown,
  prefix: string,
): KeyValueRow[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return [
      { key: prefix, value: value.map(formatPrimitive).join(", "), code: true },
    ];
  }
  if (!isRecord(value)) {
    const text = formatPrimitive(value);
    return [{ key: prefix, value: text, code: isCodeLike(text) }];
  }

  return Object.entries(value).flatMap(([key, nested]) =>
    flattenValueRows(nested, `${prefix}.${key}`),
  );
}

export function formatPrimitive(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  return JSON.stringify(value);
}

export function formatExampleValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  return JSON.stringify(value);
}

export function isCodeLike(value: string): boolean {
  return /^(https?:|wss?:|mqtts?:|s3:|\/|0x[0-9a-fA-F]+|[A-Za-z0-9_.:-]+$)/.test(
    value,
  );
}
