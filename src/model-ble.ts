// ─── Interface Spec — BLE GATT Model Types ──────────────────────────────────
// BLE GATT service, characteristic, descriptor, value, and procedure types.
// Imported by index.ts and re-exported alongside root model types.

import type { SchemaSpec } from "./model.ts";

export interface BleGattBindingSpec {
  role?: "gattServer" | "gattClient" | "both" | string;
  service?: BleGattServiceSpec;
  connection?: Record<string, unknown>;
  characteristics?: BleGattCharacteristicSpec[];
  procedures?: BleGattProcedureSpec[];
  [key: string]: unknown;
}

export interface BleGattServiceSpec {
  name?: string;
  uuid: string;
  type?: "primary" | "secondary" | string;
  description?: string;
  [key: string]: unknown;
}

export interface BleGattCharacteristicSpec {
  id?: string;
  name?: string;
  uuid: string;
  properties?: string[];
  permissions?: Record<string, string | string[]>;
  value?: BleGattValueSpec;
  descriptors?: BleGattDescriptorSpec[];
  description?: string;
  [key: string]: unknown;
}

export interface BleGattDescriptorSpec {
  name?: string;
  uuid: string;
  permissions?: Record<string, string | string[]>;
  value?: BleGattValueSpec;
  description?: string;
  [key: string]: unknown;
}

export interface BleGattValueSpec {
  schema?: string | SchemaSpec;
  contentType?: string;
  format?: string;
  byteOrder?: string;
  unit?: string;
  [key: string]: unknown;
}

export interface BleGattProcedureSpec {
  name: string;
  characteristic?: string;
  description?: string;
  [key: string]: unknown;
}
