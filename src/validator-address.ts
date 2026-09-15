import type { Operation, ParameterGroups } from "./model.ts";
import type { ValidationIssue } from "./model-normalized.ts";

const ADDRESS_PARAMETER_PATTERN = /\{([^}]+)\}/g;

export function validateAddress(
  operation: Operation,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!isRecord(operation.address)) return;
  requireNonEmptyString(operation.address.kind, `${path}.address.kind`, issues);
  requireNonEmptyString(
    operation.address.value,
    `${path}.address.value`,
    issues,
  );
  const placeholders = extractPlaceholders(operation.address.value);
  if (placeholders.size === 0) return;

  if (operation.transport === "http" && operation.address.kind === "path") {
    requireAddressParameters(
      placeholders,
      getGroupParameterNames(operation.parameters, "path"),
      `${path}.parameters.path`,
      "path",
      issues,
    );
    return;
  }
  if (operation.transport === "mqtt" && operation.address.kind === "topic") {
    requireAddressParameters(
      placeholders,
      getGroupParameterNames(operation.parameters, "topic"),
      `${path}.parameters.topic`,
      "topic",
      issues,
    );
    return;
  }

  const parameterNames = getAllParameterNames(operation.parameters);
  for (const name of placeholders) {
    if (!parameterNames.has(name)) {
      pushIssue(
        issues,
        "warning",
        `${path}.parameters`,
        `address parameter "${name}" is used in address.value but not defined in parameters.`,
      );
    }
  }
}

function requireAddressParameters(
  placeholders: ReadonlySet<string>,
  parameterNames: ReadonlySet<string>,
  path: string,
  label: string,
  issues: ValidationIssue[],
): void {
  for (const name of placeholders) {
    if (!parameterNames.has(name)) {
      pushIssue(
        issues,
        "error",
        path,
        `${label} parameter "${name}" is used in address.value but not defined under parameters.${label}.`,
      );
    }
  }
}

function getGroupParameterNames(
  parameters: ParameterGroups | undefined,
  groupName: string,
): Set<string> {
  const group = parameters?.[groupName];
  return isRecord(group) ? new Set(Object.keys(group)) : new Set<string>();
}

function getAllParameterNames(
  parameters: ParameterGroups | undefined,
): Set<string> {
  const names = new Set<string>();
  if (!isRecord(parameters)) return names;
  Object.values(parameters).forEach((group) => {
    if (isRecord(group)) {
      Object.keys(group).forEach((name) => {
        names.add(name);
      });
    }
  });
  return names;
}

function extractPlaceholders(value: unknown): Set<string> {
  if (typeof value !== "string") return new Set<string>();
  return new Set(
    Array.from(value.matchAll(ADDRESS_PARAMETER_PATTERN), (match) => match[1]),
  );
}

function requireNonEmptyString(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (typeof value !== "string" || value.trim() === "") {
    pushIssue(issues, "error", path, "must be a non-empty string.");
  }
}

function pushIssue(
  issues: ValidationIssue[],
  severity: ValidationIssue["severity"],
  path: string,
  message: string,
): void {
  issues.push({ severity, path, message });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
