import type { Operation } from "./model.ts";
import type { KeyValueRow, NormalizedAddress } from "./model-normalized.ts";
import {
  flattenValueRows,
  getRecordProperty,
  getStringProperty,
} from "./normalizer-records.ts";

const ADDRESS_LABELS: Record<string, string> = {
  path: "Path",
  topic: "Topic",
  url: "URL",
  serviceMethod: "Service Method",
  method: "Method",
  filePath: "File Path",
  queue: "Queue",
  exchange: "Exchange",
  gattService: "GATT Service UUID",
  gattCharacteristic: "GATT Characteristic UUID",
};

export function normalizeAddress(
  operation: Operation,
): NormalizedAddress | undefined {
  if (!operation.address) return undefined;
  return {
    kind: operation.address.kind,
    value: operation.address.value,
    method: operation.address.method ?? inferMethodLikeLabel(operation),
    label: ADDRESS_LABELS[operation.address.kind] ?? operation.address.kind,
  };
}

export function normalizeBindingRows(operation: Operation): KeyValueRow[] {
  const rows =
    operation.transport === "ble-gatt"
      ? flattenBleGattBindingRows(operation.bindings?.["ble-gatt"])
      : Object.entries(operation.bindings ?? {}).flatMap(([key, value]) =>
          flattenValueRows(value, key),
        );
  return rows.concat(
    flattenValueRows(operation.delivery, "delivery"),
    flattenValueRows(operation.retry, "retry"),
  );
}

export function normalizeDeliveryRows(operation: Operation): KeyValueRow[] {
  return normalizePolicyRows(operation, "delivery");
}

export function normalizeRetryRows(operation: Operation): KeyValueRow[] {
  return normalizePolicyRows(operation, "retry");
}

function inferMethodLikeLabel(operation: Operation): string | undefined {
  const binding = operation.bindings?.[operation.transport];
  switch (operation.transport) {
    case "mqtt":
      return (
        getStringProperty(binding, "direction") ?? "message"
      ).toUpperCase();
    case "websocket":
      return "CONNECT";
    case "sse":
      return "STREAM";
    case "kafka":
      return (getStringProperty(binding, "direction") ?? "event").toUpperCase();
    case "amqp":
      return (
        getStringProperty(binding, "direction") ?? "publish"
      ).toUpperCase();
    case "grpc":
      return (getStringProperty(binding, "mode") ?? "RPC").toUpperCase();
    case "graphql":
      return (
        getStringProperty(binding, "operationType") ?? "graphql"
      ).toUpperCase();
    case "jsonrpc":
      return "CALL";
    case "file":
      return (getStringProperty(binding, "direction") ?? "file").toUpperCase();
    case "ble-gatt":
      return "GATT";
    default:
      return undefined;
  }
}

function flattenBleGattBindingRows(binding: unknown): KeyValueRow[] {
  const rows: KeyValueRow[] = [];
  const role = getStringProperty(binding, "role");
  if (role) {
    rows.push({ key: "ble-gatt.role", value: role, code: true });
  }

  rows.push(
    ...flattenValueRows(
      getRecordProperty(binding, "service"),
      "ble-gatt.service",
    ),
  );
  rows.push(
    ...flattenValueRows(
      getRecordProperty(binding, "connection"),
      "ble-gatt.connection",
    ),
  );
  return rows;
}

function normalizePolicyRows(
  operation: Operation,
  policyKey: "delivery" | "retry",
): KeyValueRow[] {
  return flattenValueRows(operation[policyKey], policyKey).concat(
    Object.entries(operation.bindings ?? {}).flatMap(([bindingKey, binding]) =>
      flattenValueRows(
        getRecordProperty(binding, policyKey),
        `${bindingKey}.${policyKey}`,
      ),
    ),
  );
}
