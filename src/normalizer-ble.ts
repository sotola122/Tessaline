import type { InterfaceSpec, Operation, SchemaSpec } from "./model.ts";
import type {
  NormalizedFieldTable,
  NormalizedGenericColumn,
  NormalizedGenericTable,
} from "./model-normalized.ts";
import {
  getRecordArrayProperty,
  getRecordProperty,
  getStringArrayProperty,
  getStringProperty,
} from "./normalizer-records.ts";
import {
  createFieldTableFromSchemaSource,
  isSchemaSpec,
  schemaNameOrType,
} from "./normalizer-schema.ts";

const SERVICE_COLUMNS: NormalizedGenericColumn[] = [
  { key: "name", label: "Service" },
  { key: "uuid", label: "UUID", code: true },
  { key: "type", label: "Type", code: true },
  { key: "description", label: "Description" },
];

const CHARACTERISTIC_COLUMNS: NormalizedGenericColumn[] = [
  { key: "name", label: "Characteristic" },
  { key: "uuid", label: "UUID", code: true },
  { key: "properties", label: "Properties", code: true },
  { key: "permissions", label: "Permissions", code: true },
  { key: "value", label: "Value Schema", code: true },
  { key: "descriptors", label: "Descriptors", code: true },
  { key: "description", label: "Description" },
];

const DESCRIPTOR_COLUMNS: NormalizedGenericColumn[] = [
  { key: "characteristic", label: "Characteristic" },
  { key: "name", label: "Descriptor" },
  { key: "uuid", label: "UUID", code: true },
  { key: "permissions", label: "Permissions", code: true },
  { key: "value", label: "Value Schema", code: true },
  { key: "description", label: "Description" },
];

const PROCEDURE_COLUMNS: NormalizedGenericColumn[] = [
  { key: "name", label: "Procedure", code: true },
  { key: "characteristic", label: "Characteristic" },
  { key: "description", label: "Description" },
];

export function normalizeBleGenericTables(
  spec: InterfaceSpec,
  operation: Operation,
): NormalizedGenericTable[] {
  if (operation.transport !== "ble-gatt") return [];
  const binding = getRecordProperty(operation.bindings, "ble-gatt");
  const service = getRecordProperty(binding, "service");
  const characteristics = getRecordArrayProperty(binding, "characteristics");
  const procedures = getRecordArrayProperty(binding, "procedures");
  const tables: NormalizedGenericTable[] = [];

  if (service) {
    tables.push({
      title: "GATT Service",
      columns: SERVICE_COLUMNS,
      rows: [
        {
          name: serviceLabel(service),
          uuid: getStringProperty(service, "uuid") ?? "",
          type: getStringProperty(service, "type") ?? "",
          description: getStringProperty(service, "description") ?? "",
        },
      ],
    });
  }

  if (characteristics.length > 0) {
    tables.push({
      title: "GATT Characteristics",
      columns: CHARACTERISTIC_COLUMNS,
      rows: characteristics.map((characteristic) => ({
        name: characteristicLabel(characteristic),
        uuid: getStringProperty(characteristic, "uuid") ?? "",
        properties: getStringArrayProperty(characteristic, "properties").join(
          ", ",
        ),
        permissions: formatPermissions(
          getRecordProperty(characteristic, "permissions"),
        ),
        value: formatGattValue(
          spec,
          getRecordProperty(characteristic, "value"),
        ),
        descriptors: getRecordArrayProperty(characteristic, "descriptors")
          .map(descriptorLabel)
          .join(", "),
        description: getStringProperty(characteristic, "description") ?? "",
      })),
    });
  }

  const descriptorRows = characteristics.flatMap((characteristic) =>
    getRecordArrayProperty(characteristic, "descriptors").map((descriptor) => ({
      characteristic: characteristicLabel(characteristic),
      name: descriptorLabel(descriptor),
      uuid: getStringProperty(descriptor, "uuid") ?? "",
      permissions: formatPermissions(
        getRecordProperty(descriptor, "permissions"),
      ),
      value: formatGattValue(spec, getRecordProperty(descriptor, "value")),
      description: getStringProperty(descriptor, "description") ?? "",
    })),
  );
  if (descriptorRows.length > 0) {
    tables.push({
      title: "GATT Descriptors",
      columns: DESCRIPTOR_COLUMNS,
      rows: descriptorRows,
    });
  }

  if (procedures.length > 0) {
    tables.push({
      title: "GATT Procedures",
      columns: PROCEDURE_COLUMNS,
      rows: procedures.map((procedure) => ({
        name: getStringProperty(procedure, "name") ?? "",
        characteristic: getStringProperty(procedure, "characteristic") ?? "",
        description: getStringProperty(procedure, "description") ?? "",
      })),
    });
  }
  return tables;
}

export function normalizeBleMessageTables(
  spec: InterfaceSpec,
  operation: Operation,
): NormalizedFieldTable[] {
  if (operation.transport !== "ble-gatt") return [];
  const binding = getRecordProperty(operation.bindings, "ble-gatt");
  const characteristics = getRecordArrayProperty(binding, "characteristics");
  const characteristicTables = characteristics.flatMap((characteristic) => {
    const characteristicSchema = readSchema(
      getRecordProperty(characteristic, "value"),
    );
    return characteristicSchema
      ? [
          createFieldTableFromSchemaSource(
            spec,
            "Characteristic Value",
            characteristicSchema,
          ),
        ]
      : [];
  });
  const descriptorTables = characteristics.flatMap((characteristic) =>
    getRecordArrayProperty(characteristic, "descriptors").flatMap(
      (descriptor) => {
        const descriptorSchema = readSchema(
          getRecordProperty(descriptor, "value"),
        );
        return descriptorSchema
          ? [
              createFieldTableFromSchemaSource(
                spec,
                "Descriptor Value",
                descriptorSchema,
              ),
            ]
          : [];
      },
    ),
  );
  return characteristicTables.concat(descriptorTables);
}

function readSchema(value: unknown): string | SchemaSpec | undefined {
  const literal = getStringProperty(value, "schema");
  if (literal) return literal;
  const schema = getRecordProperty(value, "schema");
  return isSchemaSpec(schema) ? schema : undefined;
}

function serviceLabel(service: unknown): string {
  return (
    getStringProperty(service, "name") ??
    getStringProperty(service, "uuid") ??
    ""
  );
}

function characteristicLabel(characteristic: unknown): string {
  return (
    getStringProperty(characteristic, "name") ??
    getStringProperty(characteristic, "id") ??
    getStringProperty(characteristic, "uuid") ??
    ""
  );
}

function descriptorLabel(descriptor: unknown): string {
  return (
    getStringProperty(descriptor, "name") ??
    getStringProperty(descriptor, "uuid") ??
    ""
  );
}

function formatPermissions(
  permissions: Record<string, unknown> | undefined,
): string {
  if (!permissions) return "";
  return Object.entries(permissions)
    .map(
      ([key, value]) =>
        `${key}:${Array.isArray(value) ? value.join("+") : String(value)}`,
    )
    .join(", ");
}

function formatGattValue(spec: InterfaceSpec, value: unknown): string {
  const schema = readSchema(value);
  const pieces = [
    schema ? schemaNameOrType(spec, schema) : undefined,
    getStringProperty(value, "contentType"),
    labeled("format", getStringProperty(value, "format")),
    labeled("byteOrder", getStringProperty(value, "byteOrder")),
    labeled("unit", getStringProperty(value, "unit")),
  ].filter((piece): piece is string => piece !== undefined && piece !== "");
  return pieces.join(" / ");
}

function labeled(label: string, value: string | undefined): string | undefined {
  return value ? `${label}=${value}` : undefined;
}
