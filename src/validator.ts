import type { InterfaceSpec } from "./model.ts";
import type { ValidationIssue } from "./model-normalized.ts";
import {
  isRecord,
  pushIssue,
  requireNonEmptyString,
  validateOperation,
  validateSchemaObject,
} from "./validator-helpers.ts";
import { validateBleGattOperation } from "./validator-ble.ts";

class InterfaceSpecValidationError extends Error {
  readonly name = "InterfaceSpecValidationError";

  constructor(readonly issues: readonly ValidationIssue[]) {
    super(
      `Interface spec validation failed:\n${issues
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join("\n")}`,
    );
  }
}

export function validateSpec(spec: InterfaceSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const schemas = spec.components?.schemas;

  requireNonEmptyString(spec.apiVersion, "apiVersion", issues);
  if (
    typeof spec.apiVersion === "string" &&
    spec.apiVersion !== "interface-spec/v1"
  ) {
    pushIssue(
      issues,
      "error",
      "apiVersion",
      "apiVersion must be interface-spec/v1.",
    );
  }

  if (!isRecord(spec.info)) {
    pushIssue(issues, "error", "info", "info is required.");
  } else {
    requireNonEmptyString(spec.info.id, "info.id", issues);
    requireNonEmptyString(spec.info.title, "info.title", issues);
    requireNonEmptyString(spec.info.version, "info.version", issues);
  }

  if (isRecord(schemas)) {
    for (const [schemaName, schema] of Object.entries(schemas)) {
      validateSchemaObject(
        schema,
        `components.schemas.${schemaName}`,
        schemas,
        issues,
      );
    }
  }

  if (!Array.isArray(spec.operations) || spec.operations.length === 0) {
    pushIssue(
      issues,
      "error",
      "operations",
      "operations must be a non-empty array.",
    );
    return issues;
  }

  const ids = new Set<string>();
  spec.operations.forEach((operation, index) => {
    const path = `operations[${index}]`;
    validateOperation(operation, path, schemas, issues);
    validateBleGattOperation(operation, path, schemas, issues);
    if (typeof operation.id === "string" && operation.id.trim() !== "") {
      if (ids.has(operation.id)) {
        pushIssue(
          issues,
          "error",
          `${path}.id`,
          `duplicate operation id: ${operation.id}`,
        );
      }
      ids.add(operation.id);
    }
  });

  return issues;
}

export function assertValidSpec(spec: InterfaceSpec): void {
  const errors = validateSpec(spec).filter(
    (issue) => issue.severity === "error",
  );
  if (errors.length > 0) {
    throw new InterfaceSpecValidationError(errors);
  }
}
