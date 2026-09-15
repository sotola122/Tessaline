import type {
  MessageSpec,
  Operation,
  ParameterGroups,
  ResponseSpec,
  SchemaSpec,
} from "./model.ts";
import type { ValidationIssue } from "./model-normalized.ts";
import { validateAddress } from "./validator-address.ts";

const SUPPORTED_INTERFACE_TYPES = [
  "api",
  "event",
  "stream",
  "rpc",
  "batch",
  "callback",
  "device",
  "profile",
] as const;
const SUPPORTED_TRANSPORTS = [
  "http",
  "mqtt",
  "webhook",
  "websocket",
  "sse",
  "kafka",
  "amqp",
  "grpc",
  "graphql",
  "jsonrpc",
  "file",
  "cloudevents",
  "ble-gatt",
] as const;
const SUPPORTED_PATTERNS = [
  "requestResponse",
  "publishSubscribe",
  "stream",
  "callback",
  "batch",
  "attributeAccess",
] as const;

export function validateOperation(
  operation: Operation,
  path: string,
  schemas: Record<string, SchemaSpec> | undefined,
  issues: ValidationIssue[],
): void {
  requireNonEmptyString(operation.id, `${path}.id`, issues);
  requireNonEmptyString(operation.title, `${path}.title`, issues);
  requireNonEmptyString(
    operation.interfaceType,
    `${path}.interfaceType`,
    issues,
  );
  requireNonEmptyString(operation.transport, `${path}.transport`, issues);
  requireNonEmptyString(operation.pattern, `${path}.pattern`, issues);
  requireSupportedValue(
    operation.interfaceType,
    SUPPORTED_INTERFACE_TYPES,
    `${path}.interfaceType`,
    "interfaceType",
    issues,
  );
  requireSupportedValue(
    operation.transport,
    SUPPORTED_TRANSPORTS,
    `${path}.transport`,
    "transport",
    issues,
  );
  requireSupportedValue(
    operation.pattern,
    SUPPORTED_PATTERNS,
    `${path}.pattern`,
    "pattern",
    issues,
  );

  validateParameterGroups(
    operation.parameters,
    `${path}.parameters`,
    schemas,
    issues,
  );
  validateAddress(operation, path, issues);
  validateMessage(operation.request, `${path}.request`, schemas, issues);
  validateMessage(operation.response, `${path}.response`, schemas, issues);
  validateMessage(operation.message, `${path}.message`, schemas, issues);
  operation.messages?.forEach((message, index) => {
    validateMessage(message, `${path}.messages[${index}]`, schemas, issues);
  });
  Object.entries(operation.responses ?? {}).forEach(([status, response]) => {
    validateResponse(response, `${path}.responses.${status}`, schemas, issues);
  });
}

export function validateSchemaObject(
  schema: unknown,
  path: string,
  schemas: Record<string, SchemaSpec> | undefined,
  issues: ValidationIssue[],
): void {
  if (!isRecord(schema)) {
    pushIssue(
      issues,
      "error",
      path,
      "schema must be a string reference or object.",
    );
    return;
  }
  requireNonEmptyString(schema.type, `${path}.type`, issues);
  if (isRecord(schema.fields)) {
    for (const [fieldName, field] of Object.entries(schema.fields)) {
      validateSchemaObject(
        field,
        `${path}.fields.${fieldName}`,
        schemas,
        issues,
      );
    }
  }
  if ("items" in schema && schema.items !== undefined) {
    validateSchemaReference(schema.items, `${path}.items`, schemas, issues);
  }
}

export function pushIssue(
  issues: ValidationIssue[],
  severity: ValidationIssue["severity"],
  path: string,
  message: string,
): void {
  issues.push({ severity, path, message });
}

export function requireNonEmptyString(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (typeof value !== "string" || value.trim() === "") {
    pushIssue(issues, "error", path, "must be a non-empty string.");
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateMessage(
  message: MessageSpec | undefined,
  path: string,
  schemas: Record<string, SchemaSpec> | undefined,
  issues: ValidationIssue[],
): void {
  if (!isRecord(message)) return;
  if (!("schema" in message)) {
    pushIssue(issues, "error", `${path}.schema`, "schema is required.");
    return;
  }
  validateSchemaReference(message.schema, `${path}.schema`, schemas, issues);
}

function validateResponse(
  response: ResponseSpec,
  path: string,
  schemas: Record<string, SchemaSpec> | undefined,
  issues: ValidationIssue[],
): void {
  if (!isRecord(response) || response.schema === undefined) return;
  validateSchemaReference(response.schema, `${path}.schema`, schemas, issues);
}

function validateParameterGroups(
  parameters: ParameterGroups | undefined,
  path: string,
  schemas: Record<string, SchemaSpec> | undefined,
  issues: ValidationIssue[],
): void {
  if (!isRecord(parameters)) return;
  for (const [groupName, group] of Object.entries(parameters)) {
    if (!isRecord(group)) continue;
    for (const [parameterName, field] of Object.entries(group)) {
      validateSchemaObject(
        field,
        `${path}.${groupName}.${parameterName}`,
        schemas,
        issues,
      );
    }
  }
}

export function validateSchemaReference(
  schema: unknown,
  path: string,
  schemas: Record<string, SchemaSpec> | undefined,
  issues: ValidationIssue[],
): void {
  if (typeof schema === "string") {
    if (!schemas?.[schema]) {
      pushIssue(issues, "error", path, `schema reference not found: ${schema}`);
    }
    return;
  }
  validateSchemaObject(schema, path, schemas, issues);
}

function requireSupportedValue(
  value: unknown,
  supported: readonly string[],
  path: string,
  label: string,
  issues: ValidationIssue[],
): void {
  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    !supported.includes(value)
  ) {
    pushIssue(issues, "error", path, `unsupported ${label}: ${value}`);
  }
}
