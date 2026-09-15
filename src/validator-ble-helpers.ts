import type { SchemaSpec } from "./model.ts";
import type { ValidationIssue } from "./model-normalized.ts";
import {
  isRecord,
  pushIssue,
  requireNonEmptyString,
  validateSchemaReference,
} from "./validator-helpers.ts";

const SUPPORTED_BLE_SERVICE_TYPES = ["primary", "secondary"] as const;
const SUPPORTED_BLE_CHARACTERISTIC_PROPERTIES = [
  "read",
  "write",
  "writeWithoutResponse",
  "notify",
  "indicate",
] as const;
const BLE_UUID_16_WITH_PREFIX_PATTERN = /^0x[0-9a-fA-F]{4}$/;
const BLE_UUID_16_PATTERN = /^[0-9a-fA-F]{4}$/;
const BLE_UUID_128_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const CCCD_UUID_CANONICAL = "00002902-0000-1000-8000-00805f9b34fb";

export function requireBleLiteral(
  value: unknown,
  expected: string,
  path: string,
  message: string,
  issues: ValidationIssue[],
): void {
  if (typeof value === "string" && value === expected) return;
  pushIssue(issues, "error", path, message);
}

export function requireSupportedBleServiceType(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (value === undefined) return;
  if (
    typeof value === "string" &&
    SUPPORTED_BLE_SERVICE_TYPES.some((serviceType) => serviceType === value)
  ) {
    return;
  }
  if (typeof value === "string" && value.trim() !== "") {
    pushIssue(issues, "error", path, `unsupported BLE service type: ${value}`);
  }
}

export function validateCharacteristicProperties(
  properties: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!Array.isArray(properties) || properties.length === 0) {
    pushIssue(issues, "error", path, "properties must be a non-empty array.");
    return;
  }
  properties.forEach((property, index) => {
    const propertyPath = `${path}[${index}]`;
    requireNonEmptyString(property, propertyPath, issues);
    if (
      typeof property === "string" &&
      property.trim() !== "" &&
      !SUPPORTED_BLE_CHARACTERISTIC_PROPERTIES.some(
        (supportedProperty) => supportedProperty === property,
      )
    ) {
      pushIssue(
        issues,
        "error",
        propertyPath,
        `unsupported BLE characteristic property: ${property}`,
      );
    }
  });
}

export function validateBleValue(
  value: unknown,
  path: string,
  schemas: Record<string, SchemaSpec> | undefined,
  issues: ValidationIssue[],
): void {
  if (!isRecord(value)) return;
  if (!("schema" in value) || value.schema === undefined) {
    pushIssue(issues, "error", `${path}.schema`, "schema is required.");
    return;
  }
  validateSchemaReference(value.schema, `${path}.schema`, schemas, issues);
}

export function validateDescriptors(
  descriptors: unknown,
  path: string,
  schemas: Record<string, SchemaSpec> | undefined,
  issues: ValidationIssue[],
): Set<string> {
  const uuids = new Set<string>();
  if (!Array.isArray(descriptors)) return uuids;
  descriptors.forEach((descriptor, index) => {
    const descriptorPath = `${path}[${index}]`;
    if (!isRecord(descriptor)) {
      pushIssue(
        issues,
        "error",
        descriptorPath,
        "descriptor must be an object.",
      );
      return;
    }

    requireNonEmptyString(descriptor.uuid, `${descriptorPath}.uuid`, issues);
    if (typeof descriptor.uuid === "string" && descriptor.uuid.trim() !== "") {
      validateBleUuid(descriptor.uuid, `${descriptorPath}.uuid`, issues);
      uuids.add(descriptor.uuid.toLowerCase());
    }
    validateBleValue(
      descriptor.value,
      `${descriptorPath}.value`,
      schemas,
      issues,
    );
  });
  return uuids;
}

export function warnIfMissingCccd(
  properties: unknown,
  descriptorUuids: ReadonlySet<string>,
  characteristicPath: string,
  issues: ValidationIssue[],
): void {
  if (!Array.isArray(properties)) return;
  const hasNotifyOrIndicate = properties.some(
    (property) => property === "notify" || property === "indicate",
  );
  if (!hasNotifyOrIndicate || hasCccdDescriptor(descriptorUuids)) return;

  pushIssue(
    issues,
    "warning",
    `${characteristicPath}.descriptors`,
    "notify/indicate characteristics should define a CCCD descriptor (0x2902).",
  );
}

export function validateBleUuid(
  value: string,
  path: string,
  issues: ValidationIssue[],
): void {
  if (
    BLE_UUID_16_WITH_PREFIX_PATTERN.test(value) ||
    BLE_UUID_16_PATTERN.test(value) ||
    BLE_UUID_128_PATTERN.test(value)
  ) {
    return;
  }
  pushIssue(issues, "error", path, `invalid BLE UUID format: ${value}`);
}

function hasCccdDescriptor(descriptorUuids: ReadonlySet<string>): boolean {
  return (
    descriptorUuids.has("0x2902") ||
    descriptorUuids.has("2902") ||
    descriptorUuids.has(CCCD_UUID_CANONICAL)
  );
}
