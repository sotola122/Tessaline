import type { Operation, SchemaSpec } from "./model.ts";
import type { ValidationIssue } from "./model-normalized.ts";
import {
  isRecord,
  pushIssue,
  requireNonEmptyString,
} from "./validator-helpers.ts";
import {
  requireBleLiteral,
  requireSupportedBleServiceType,
  validateBleUuid,
  validateBleValue,
  validateCharacteristicProperties,
  validateDescriptors,
  warnIfMissingCccd,
} from "./validator-ble-helpers.ts";

export function validateBleGattOperation(
  operation: Operation,
  path: string,
  schemas: Record<string, SchemaSpec> | undefined,
  issues: ValidationIssue[],
): void {
  if (operation.transport !== "ble-gatt") return;

  requireBleLiteral(
    operation.interfaceType,
    "device",
    `${path}.interfaceType`,
    "ble-gatt operations must use interfaceType: device.",
    issues,
  );
  requireBleLiteral(
    operation.pattern,
    "attributeAccess",
    `${path}.pattern`,
    "ble-gatt operations must use pattern: attributeAccess.",
    issues,
  );
  validateBleAddress(operation.address, `${path}.address`, issues);

  const binding = isRecord(operation.bindings)
    ? operation.bindings["ble-gatt"]
    : undefined;
  if (!isRecord(binding)) {
    pushIssue(
      issues,
      "error",
      `${path}.bindings.ble-gatt`,
      "ble-gatt binding is required.",
    );
    return;
  }

  validateBleBinding(binding, `${path}.bindings.ble-gatt`, schemas, issues);
}

function validateBleAddress(
  address: Operation["address"],
  path: string,
  issues: ValidationIssue[],
): void {
  if (!isRecord(address)) {
    pushIssue(
      issues,
      "error",
      `${path}.kind`,
      "ble-gatt operations must use address.kind: gattService.",
    );
    pushIssue(issues, "error", `${path}.value`, "must be a non-empty string.");
    return;
  }

  requireBleLiteral(
    address.kind,
    "gattService",
    `${path}.kind`,
    "ble-gatt operations must use address.kind: gattService.",
    issues,
  );
  requireNonEmptyString(address.value, `${path}.value`, issues);
  if (typeof address.value === "string" && address.value.trim() !== "") {
    validateBleUuid(address.value, `${path}.value`, issues);
  }
}

function validateBleBinding(
  binding: Record<string, unknown>,
  path: string,
  schemas: Record<string, SchemaSpec> | undefined,
  issues: ValidationIssue[],
): void {
  if (!isRecord(binding.service)) {
    pushIssue(issues, "error", `${path}.service`, "service is required.");
  } else {
    requireNonEmptyString(binding.service.uuid, `${path}.service.uuid`, issues);
    if (
      typeof binding.service.uuid === "string" &&
      binding.service.uuid.trim() !== ""
    ) {
      validateBleUuid(binding.service.uuid, `${path}.service.uuid`, issues);
    }
    requireSupportedBleServiceType(
      binding.service.type,
      `${path}.service.type`,
      issues,
    );
  }

  if (!Array.isArray(binding.characteristics)) return;
  binding.characteristics.forEach((characteristic, index) => {
    const characteristicPath = `${path}.characteristics[${index}]`;
    if (!isRecord(characteristic)) {
      pushIssue(
        issues,
        "error",
        characteristicPath,
        "characteristic must be an object.",
      );
      return;
    }

    requireNonEmptyString(
      characteristic.uuid,
      `${characteristicPath}.uuid`,
      issues,
    );
    if (
      typeof characteristic.uuid === "string" &&
      characteristic.uuid.trim() !== ""
    ) {
      validateBleUuid(
        characteristic.uuid,
        `${characteristicPath}.uuid`,
        issues,
      );
    }

    validateCharacteristicProperties(
      characteristic.properties,
      `${characteristicPath}.properties`,
      issues,
    );
    validateBleValue(
      characteristic.value,
      `${characteristicPath}.value`,
      schemas,
      issues,
    );

    const descriptors = validateDescriptors(
      characteristic.descriptors,
      `${characteristicPath}.descriptors`,
      schemas,
      issues,
    );
    warnIfMissingCccd(
      characteristic.properties,
      descriptors,
      characteristicPath,
      issues,
    );
  });
}
