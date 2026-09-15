import type {
  ExampleSpec,
  InterfaceSpec,
  MessageSpec,
  Operation,
  SchemaSpec,
} from "./model.ts";
import type {
  NormalizedExample,
  NormalizedFieldRow,
  NormalizedFieldTable,
  NormalizedResponseRow,
} from "./model-normalized.ts";
import { formatExampleValue, isRecord } from "./normalizer-records.ts";

export function normalizeParameterTables(
  operation: Operation,
): NormalizedFieldTable[] {
  return Object.entries(operation.parameters ?? {}).map(([group, fields]) => ({
    title: `${capitalize(group)} Parameters`,
    rows: Object.entries(fields).flatMap(([name, field]) =>
      flattenFieldRows(undefined, name, field, 0),
    ),
  }));
}

export function normalizeMessageTables(
  spec: InterfaceSpec,
  operation: Operation,
): NormalizedFieldTable[] {
  const tables: NormalizedFieldTable[] = [];
  if (operation.request) {
    tables.push(createMessageTable(spec, operation.request, "Request"));
  }
  if (operation.response) {
    tables.push(createMessageTable(spec, operation.response, "Response"));
  }
  if (operation.message) {
    tables.push(
      createMessageTable(
        spec,
        operation.message,
        titleFromRole(operation.message.role, "Message"),
      ),
    );
  }
  operation.messages?.forEach((message, index) => {
    const title =
      message.title ??
      message.id ??
      titleFromRole(message.role, `Message ${index + 1}`);
    tables.push(createMessageTable(spec, message, title));
  });
  return tables;
}

export function normalizeResponseRows(
  spec: InterfaceSpec,
  operation: Operation,
): NormalizedResponseRow[] {
  const rows: NormalizedResponseRow[] = [];
  if (operation.response) {
    rows.push({
      status: "response",
      schema: schemaNameOrType(spec, operation.response.schema),
      contentType: operation.response.contentType,
      description: operation.response.title,
    });
  }
  Object.entries(operation.responses ?? {}).forEach(([status, response]) => {
    rows.push({
      status,
      schema:
        response.schema === undefined
          ? undefined
          : schemaNameOrType(spec, response.schema),
      contentType: response.contentType,
      description: response.description,
    });
  });
  return rows;
}

export function normalizeExamples(
  examples: readonly ExampleSpec[] | undefined,
): NormalizedExample[] {
  return (examples ?? []).map((example) => ({
    title: example.title,
    role: example.role,
    value:
      typeof example.value === "string"
        ? example.value
        : JSON.stringify(example.value, null, 2),
  }));
}

export function createFieldTableFromSchemaSource(
  spec: InterfaceSpec,
  title: string,
  schema: string | SchemaSpec,
): NormalizedFieldTable {
  return { title, rows: schemaToRows(spec, schema) };
}

export function schemaNameOrType(
  spec: InterfaceSpec | undefined,
  schema: string | SchemaSpec,
): string {
  return typeof schema === "string" ? schema : resolveSchema(spec, schema).type;
}

export function isSchemaSpec(value: unknown): value is SchemaSpec {
  return isRecord(value) && typeof value.type === "string";
}

function createMessageTable(
  spec: InterfaceSpec,
  message: MessageSpec,
  baseTitle: string,
): NormalizedFieldTable {
  const direction = message.direction ? ` (${message.direction})` : "";
  const contentType = message.contentType ? ` - ${message.contentType}` : "";
  return createFieldTableFromSchemaSource(
    spec,
    `${baseTitle}${direction}${contentType}`,
    message.schema,
  );
}

function schemaToRows(
  spec: InterfaceSpec | undefined,
  schemaSource: string | SchemaSpec,
): NormalizedFieldRow[] {
  const schema = resolveSchema(spec, schemaSource);
  if (schema.type === "object" && schema.fields) {
    return Object.entries(schema.fields).flatMap(([name, field]) =>
      flattenFieldRows(spec, name, field, 0),
    );
  }
  return [buildRow(spec, "$", schema, 0)];
}

function flattenFieldRows(
  spec: InterfaceSpec | undefined,
  path: string,
  field: SchemaSpec,
  depth: number,
): NormalizedFieldRow[] {
  const rows = [buildRow(spec, path, field, depth)];
  const resolvedField = resolveSchema(spec, field);
  if (resolvedField.type === "object" && resolvedField.fields) {
    return rows.concat(
      Object.entries(resolvedField.fields).flatMap(([name, nested]) =>
        flattenFieldRows(spec, `${path}.${name}`, nested, depth + 1),
      ),
    );
  }
  if (resolvedField.type !== "array" || resolvedField.items === undefined) {
    return rows;
  }

  const itemSchema = resolveSchema(spec, resolvedField.items);
  if (itemSchema.type === "object" && itemSchema.fields) {
    return rows.concat(
      Object.entries(itemSchema.fields).flatMap(([name, nested]) =>
        flattenFieldRows(spec, `${path}[].${name}`, nested, depth + 1),
      ),
    );
  }
  return rows;
}

function buildRow(
  spec: InterfaceSpec | undefined,
  path: string,
  field: SchemaSpec,
  depth: number,
): NormalizedFieldRow {
  const resolved = resolveSchema(spec, field);
  return {
    path,
    type: displayType(spec, resolved),
    required: resolved.required === true,
    example:
      resolved.example === undefined
        ? undefined
        : formatExampleValue(resolved.example),
    description: resolved.description,
    enumValues: resolved.enum?.map(String).join(" | "),
    unit: resolved.unit,
    deprecated: resolved.deprecated === true ? true : undefined,
    depth,
  };
}

function resolveSchema(
  spec: InterfaceSpec | undefined,
  schema: string | SchemaSpec,
): SchemaSpec {
  if (typeof schema !== "string") return schema;
  return spec?.components?.schemas?.[schema] ?? { type: schema };
}

function displayType(
  spec: InterfaceSpec | undefined,
  field: SchemaSpec,
): string {
  const resolved = resolveSchema(spec, field);
  if (resolved.enum?.length) {
    return `${resolved.type}<${resolved.enum.map(String).join(" | ")}>`;
  }
  if (resolved.type === "array" && resolved.items !== undefined) {
    return `array<${schemaNameOrType(spec, resolved.items)}>`;
  }
  return resolved.type;
}

function titleFromRole(role: string | undefined, fallback: string): string {
  if (!role) return fallback;
  return role
    .split(/[-_\s]/g)
    .filter(Boolean)
    .map(capitalize)
    .join(" ");
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
